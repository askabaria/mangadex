import { MangaArguments, Runner } from "@manga/arguments";
import { mangadexApi, mangadexUploadsApi } from "@manga/commands";
import { MangaSearchResult } from "libs/@manga/commands/src/models/MangaSearchResult";

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

function getTitle(manga: MangaSearchResult) {
  return manga.attributes.title.en ?? Object.values(manga.attributes.title)[0];
}

export class DevRunner implements Runner {
  run(args: MangaArguments): boolean {
    const search = (args.get("dev-search") ?? []).join(" ");
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
                downloadPage: {
                  single: {
                    manga: e,
                    targetFile: `${getTitle(e).replaceAll(/\W/g, "_")}.png`,
                  },
                },
              })
            )
          );
        });
    }
    return false;
  }
}
