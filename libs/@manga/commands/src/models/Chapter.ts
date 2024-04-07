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
  if (!Object.hasOwn(chapter.chapter, quality)) {
    console.error("eeh?", JSON.stringify(chapter));
  }
  return chapter.chapter[quality].map(
    (fileUrl) =>
      `${chapter.baseUrl}/${quality}/${chapter.chapter.hash}/${fileUrl}`
  );
}
