import { M_Relation } from "./part/Relationship";
import { M_LangCodes, M_RelationshipTypes, M_Timestamp } from "./static-data";

/**
 * describes a chapter
 */
export type MangaFeedItem = {
  id: string;
  type: M_RelationshipTypes;
  attributes: {
    volume: string;
    chapter: string;
    title: string;
    translatedLanguage: M_LangCodes;
    externalUrl: null | string;
    publishAt: M_Timestamp;
    readableAt: M_Timestamp;
    createdAt: M_Timestamp;
    updatedAt: M_Timestamp;
    pages: number;
    version: number;
  };
  relationships: M_Relation[];
};
