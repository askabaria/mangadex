import { WebApiClient, CommandExecutor } from "@aska/commands";
import { MangaSearchResult } from "./models/MangaSearchResult";
import { MangaFeedItem } from "./models/MangaFeed";
import { M_Chapter } from "./models/Chapter";
import { existsSync, mkdirSync, readFileSync, statSync, unlinkSync } from "fs";
import { cwd } from "process";
import { combineLatest, combineLatestAll, from, map, Observable, of } from "rxjs";
import { rateLimit } from "@aska/utils";

const log = (...args: any[]) => {};

export const MANGADEX_API_RATE_LIMIT = rateLimit({
  tokens: 3,
  reuseTime: 1000 * 10,
  name: "INFO-API"
});
export const MANGADEX_DOWNLOAD_RATE_LIMIT = rateLimit({
  tokens: 3,
  reuseTime: 1000 * 10,
  name: "DOWNLOAD-API"
});

export const mangadexApi = new WebApiClient({
  baseUrl: "https://api.mangadex.org",
  name: "mangadex",
  rateLimit: MANGADEX_API_RATE_LIMIT,
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
        renderReq({ mangaId, offset = 0 }: { mangaId: string, offset?: number }) {
          return {
            url: [mangaId, "feed"],
            queryArgs: {
              // "includes[]": "cover_art",
              // @todo: request pages, ok for now... a little...
              // worked well with 500
              limit: "200",
              offset: String(offset),
            },
          };
        },
        parseRes(result, b: { mangaId: string, offset?: number }): Observable<MangaFeedItem[]> | MangaFeedItem[] {
          const response = JSON.parse(result.body);
          log("@todo: check response for integrity");
          const { data, total, limit, offset } = response;
          if(offset + data.length >= total){
            return data as MangaFeedItem[];
          }
          return combineLatest(
            from([data as MangaFeedItem[]]),
            mangadexApi.issue({manga: {getFeed: {
              mangaId: b.mangaId,
              offset: offset + limit,
            }}}) as Observable<MangaFeedItem[]>
          ).pipe(map(f => {
            return f.flat(1);
          })) as Observable<MangaFeedItem[]>;
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
          if (response.result !== "ok") {
            debugger;
          }
          log("@todo: check response for integrity");
          log("@todo: check response for pages");
          return response as M_Chapter;
        },
      },
    },
  },
  autoParamDepth: 1,
});
const mangadexNetworkApi = new WebApiClient({
  baseUrl: "https://api.mangadex.network",
  name: "mangadex-network",
  rateLimit: MANGADEX_API_RATE_LIMIT,
  requests: {
    report: {
      imgload: {
        renderReq({
          url,
          success,
          cached,
          bytes,
          duration,
        }: {
          url: string;
          success: boolean;
          cached: boolean;
          bytes: number;
          duration: number;
        }) {
          return {
            url: [],
            method: "POST",
            headers: { "Content-Type": "application/json" },
            data: JSON.stringify({ url, success, cached, bytes, duration }),
          };
        },
        parseRes(result, options) {
          // const response = JSON.parse(result.body);
          log("@todo: check response for integrity");
          log("@todo: check response for pages");
          // return response.data as MangaSearchResult[];
          return true;
        },
      },
    },
  },
  autoParamDepth: 1,
});

// const dirname = new CommandExecutor("dirname", {
//   commands: {
//     show: {
//       parentDirectory: {
//         renderArgs(path: string, scope) {
//           return path;
//         },
//         parseRes(result, options, scope) {
//           return true;
//         },
//       },
//     },
//   },
//   autoParamDepth: 0,
// });

// const realpath = new CommandExecutor("realpath", {
//   commands: {
//     show: {
//       realpath: {
//         renderArgs(path: string, scope) {
//           return path;
//         },
//         parseRes(result, options, scope) {
//           return true;
//         },
//       },
//     },
//   },
//   autoParamDepth: 0,
// });

// const mkdir = new CommandExecutor("mkdir", {
//   commands: {
//     create: {
//       directory: {
//         renderArgs(path: string, scope) {
//           return `-p ${path}`;
//         },
//         parseRes(result, options, scope) {
//           return true;
//         },
//       },
//     },
//   },
//   autoParamDepth: 0,
// });

// function makeParentDirectory(path: string) {
//   return mkdir.issue({
//     create: { directory: path.substring(0, path.lastIndexOf("/")) },
//   });
// }

export const mangadexUploadsApi = new CommandExecutor(
  "curl",
  {
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
            return `"https://uploads.mangadex.org/covers/${mangaId}/${fileName}" --create-dirs --silent --output "${targetFile}"`;
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
            const compiledArgs = `"${url}" --silent --output "${targetFile}" -D "${targetFile}.headers"`;
            const mkdirTarget = targetFile.substring(
              0,
              targetFile.lastIndexOf("/")
            );
            for (let i = 0; i < 10; ++i) {
              try {
                if (existsSync(mkdirTarget)) {
                  break;
                }
                mkdirSync(mkdirTarget, {
                  recursive: true,
                });
                break; // retry...
              } catch (e) {}
            }
            (scope as { reqStart: number }).reqStart = Date.now();
            return compiledArgs;
          },
          parseRes: (result, options, scope) => {
            const duration =
              Date.now() - (scope as { reqStart: number }).reqStart;
            const hFile = options.targetFile + ".headers";
            if (options.url.includes("mangadex.org")) {
              unlinkSync(hFile);
              return of(false);
            }
            const headers = readFileSync(hFile, "utf-8")
              .split("\n")
              .splice(1)
              .reduce((acc, l) => {
                const at = l.indexOf(":");
                return {
                  ...acc,
                  [l.substring(0, at).toLowerCase()]: l
                    .substring(at + 1)
                    .trim()
                    .toLowerCase(),
                };
              }, {} as Record<string, string>);
            unlinkSync(hFile);
            const fileSize = statSync(options.targetFile).size;
            // console.log(result);
            // otherwise report status of request:
            return mangadexNetworkApi.issue({
              report: {
                imgload: {
                  url: options.url,
                  // @todo: actually check the return-type of the curl-request...
                  success: fileSize > 0,
                  cached: (headers["x-cache"] ?? "").startsWith("HIT"),
                  bytes: fileSize,
                  duration,
                },
              },
            });
          },
        },
      },
    },
  },
  {
    defaultScope: {
      reqStart: undefined as unknown as number,
    },
  }
);
