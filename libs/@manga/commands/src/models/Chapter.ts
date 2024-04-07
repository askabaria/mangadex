export type M_Chapter = {
  baseUrl: string;
  chapter: {
    // filenames
    data: string[];
    dataSaver: string[];
    hash: string;
  };
  result: "ok" | string;
};

export function listChapterImages(chapter: M_Chapter, save = false) {
  const quality = save ? "dataSaver" : "data";
  console.log(chapter);
  return chapter.chapter[quality].map(
    (fileUrl) =>
      `${chapter.baseUrl}/${quality}/${chapter.chapter.hash}/${fileUrl}`
  );
}
