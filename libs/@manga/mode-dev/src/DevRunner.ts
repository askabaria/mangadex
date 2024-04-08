import { MangaArguments, Runner } from "@manga/arguments";
import {
  MANGADEX_DOWNLOAD_RATE_LIMIT,
  mangadexApi,
  mangadexUploadsApi,
} from "@manga/commands";
import {
  M_Chapter,
  listChapterImages,
} from "libs/@manga/commands/src/models/Chapter";
import { MangaFeedItem } from "libs/@manga/commands/src/models/MangaFeed";
import { MangaSearchResult } from "libs/@manga/commands/src/models/MangaSearchResult";
import { M_LangCodes } from "libs/@manga/commands/src/models/static-data";
import { combineLatest, defer, map, of, switchMap } from "rxjs";

function getCoverArt(manga: MangaSearchResult) {
  const coverDescription = manga.relationships.find(
    (r) => r.type === "cover_art"
  );
  if (
    coverDescription === undefined ||
    coverDescription.attributes === undefined
  ) {
    return undefined;
  }
  return `https://uploads.mangadex.org/covers/${manga.id}/${coverDescription.attributes.fileName}`;
}

function getTitle(manga: MangaSearchResult, envLangs: string[]) {
  for (const lang of [
    ...envLangs,
    ...Object.keys(manga.attributes.title),
  ] as M_LangCodes[]) {
    if (Object.hasOwn(manga.attributes.title, lang)) {
      return manga.attributes.title[lang];
    }
  }
  return "---";
}

function sanatize(part: string): string {
  return part
    .replaceAll(/[^0-9a-zA-Z]/g, "_")
    .replaceAll(/__+/g, "_")
    .replaceAll("_", " ")
    .trim();
}

const dbg = {
  loadedChapterInfo: (
    chapter: MangaFeedItem,
    feed: MangaSearchResult,
    envLangs: string[]
  ) =>
    console.log(
      `loaded info for chapter [${chapter.attributes.chapter}] @ ${
        chapter.attributes.translatedLanguage
      }} : ${getTitle(feed, envLangs)}`
    ),
};

export class DevRunner implements Runner {
  run(args: MangaArguments): boolean {
    const search = (args.get("dev-search") ?? []).join(" ");
    const fetch = args.get("dev-fetch") ?? [];
    const envLangs = args.get("env-lang") ?? ["en"];
    const targetDir = args.get("target")[0];

    const auto = args.get("auto") ?? [];

    if (auto.length > 0) {
      const ids = auto
        // replace url's with title id's, filter out unknown
        .map((au) => au.replace(/.+title\/([^\/]+)\/.+/g, `$1`))
        .filter((id, i) => id !== auto[i]);
      fetch.push(...ids);
    }

    if (search.length > 0) {
      mangadexApi
        .issue({
          manga: {
            search: { text: search },
          },
        })
        .subscribe((r) => {
          console.log(
            r.map((e, i) =>
              mangadexUploadsApi.issue({
                downloadCover: {
                  single: {
                    manga: e,
                    targetFile: `${e.id}-${sanatize(
                      getTitle(e, envLangs)
                    )}.png`,
                  },
                },
              })
            )
          );
        });
    }
    if (fetch.length > 0) {
      for (const mangaId of fetch) {
        // @todo: dynamic output path by string template
        mangadexApi
          .issue({ manga: { getFeed: { mangaId: mangaId } } })
          .pipe(
            switchMap((data) => {
              return mangadexApi
                .issue({ manga: { getInfo: { mangaId: mangaId } } })
                .pipe(
                  map((manga) => ({
                    feed: data,
                    manga,
                  }))
                );
            }),
            switchMap((r) => {
              const selectedChapters = r.feed.filter((ch) =>
                envLangs.includes(ch.attributes.translatedLanguage)
              );
              return combineLatest(
                selectedChapters.map((chap) =>
                  mangadexApi
                    .issue({
                      // get from chapter-list to each chapters list of images
                      "at-home": { listChapter: { chapterId: chap.id } },
                    })
                    .pipe(
                      map(
                        (cData) => (
                          dbg.loadedChapterInfo(chap, r.manga, envLangs),
                          {
                            chapterData: chap,
                            chapterImgRefs: cData,
                            images: listChapterImages(cData),
                          }
                        )
                      )
                    )
                )
              ).pipe(
                map((d) => ({
                  ...r,
                  chapters: d,
                }))
              );
            }),
            switchMap((data) =>
              combineLatest(
                data.chapters
                  .map((chapter) => {
                    return listChapterImages(chapter.chapterImgRefs).map(
                      (imageUrl, index) =>
                        of(true).pipe(
                          MANGADEX_DOWNLOAD_RATE_LIMIT,
                          switchMap(() =>
                            mangadexUploadsApi.issue({
                              download: {
                                file: {
                                  url: imageUrl,
                                  // keeps file-endinf od original file
                                  targetFile: `${targetDir}/${
                                    chapter.chapterData.attributes
                                      .translatedLanguage
                                  }/${sanatize(
                                    getTitle(data.manga, envLangs)
                                  )}/${sanatize(
                                    chapter.chapterData.attributes.chapter
                                  )}/${String(index).padStart(
                                    4,
                                    "0"
                                  )}${imageUrl.substring(
                                    imageUrl.lastIndexOf(".")
                                  )}`,
                                },
                              },
                            })
                          )
                        )
                    );
                  })
                  .flat(1)
              )
            )
          )
          .subscribe((r) => {
            // currently contains a list of which images have been loaded externally...
            console.log(`${r.length} images loaded`);
          });
      }
    }
    return false;
  }
}
