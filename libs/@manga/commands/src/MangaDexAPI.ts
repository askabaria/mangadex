import { WebApiClient, CommandExecutor } from "@aska/commands";
import { MangaSearchResult } from "./models/MangaSearchResult";
import { MangaFeedItem } from "./models/MangaFeed";
import { M_Chapter } from "./models/Chapter";

const log = (...args: any[]) => {};

export const mangadexApi = new WebApiClient({
  baseUrl: "https://api.mangadex.org",
  name: "mangadex",
  requests: {
    manga: {
      search: {
        renderReq({ text = undefined as undefined | string }) {
          if (text === undefined) {
            return {
              url: "",
            };
          }
          return {
            url: [],
            queryArgs: {
              title: text,
              /**
               * @todo: encode array-elements by "key: ['v1','v2']" expanded to key[]=v1&key[]=v2
               */
              "includes[]": "cover_art",
            },
          };
        },
        parseRes(result, { text = undefined as undefined | string }) {
          const response = JSON.parse(result.body);
          log("@todo: check response for integrity");
          log("@todo: check response for pages");
          return response.data as MangaSearchResult[];
        },
      },
      getInfo: {
        renderReq({ mangaId }: { mangaId: string }) {
          return {
            url: [mangaId],
            queryArgs: {
              "includes[]": "cover_art",
            },
          };
        },
        parseRes(result, { text = undefined as undefined | string }) {
          const response = JSON.parse(result.body);
          log("@todo: check response for integrity");
          log("@todo: check response for pages");
          return response.data as MangaSearchResult;
        },
      },
      getFeed: {
        renderReq({ mangaId }: { mangaId: string }) {
          return {
            url: [mangaId, "feed"],
            queryArgs: {
              // "includes[]": "cover_art",
            },
          };
        },
        parseRes(result, { text = undefined as undefined | string }) {
          const response = JSON.parse(result.body);
          log("@todo: check response for integrity");
          log("@todo: check response for pages");
          return response.data as MangaFeedItem[];
        },
      },
    },
    "at-home": {
      listChapter: {
        renderReq({ chapterId }: { chapterId: string }) {
          return {
            url: ["server", chapterId],
            queryArgs: {
              // "includes[]": "cover_art",
            },
          };
        },
        parseRes(result, { text = undefined as undefined | string }) {
          const response = JSON.parse(result.body);
          log("@todo: check response for integrity");
          log("@todo: check response for pages");
          return response as M_Chapter;
        },
      },
    },
  },
  autoParamDepth: 1,
});

export const mangadexUploadsApi = new CommandExecutor("curl", {
  autoParamDepth: 0,
  commands: {
    downloadCover: {
      single: {
        renderArgs: (
          {
            manga = undefined,
            mangaId = undefined,
            fileName = undefined,
            targetFile,
          }: {
            manga: MangaSearchResult | undefined;
            mangaId: undefined | string;
            fileName: undefined | string;
            targetFile: string;
          },
          scope
        ) => {
          if (manga !== undefined) {
            mangaId = manga.id;
            const coverDescription = manga.relationships.find(
              (r) => r.type === "cover_art"
            );
            if (
              coverDescription !== undefined &&
              coverDescription.attributes !== undefined
            ) {
              fileName = coverDescription.attributes.fileName;
            }
          }
          if (fileName === undefined || mangaId === undefined) {
            throw new Error(
              "*must specify either the manga-object, or a manga-id + file-id"
            );
          }
          return `"https://uploads.mangadex.org/covers/${mangaId}/${fileName}" --silent --output ${targetFile}`;
        },
        parseRes: (result, options, scope) => {
          // console.log(result);
          return null;
        },
      },
    },
    download: {
      file: {
        renderArgs: (
          {
            url,
            targetFile,
          }: {
            url: string;
            targetFile: string;
          },
          scope
        ) => {
          console.log(`Downloading ${url} to ${targetFile}`);
          return `"${url}" --silent --output ${targetFile}`;
        },
        parseRes: (result, options, scope) => {
          // console.log(result);
          console.log(`${options.targetFile} done`);
          return true;
        },
      },
    },
  },
});
