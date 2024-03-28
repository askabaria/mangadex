import {
  M_Demographic,
  M_LangCodes,
  M_LinkField,
  M_MultiLang,
  M_Related,
  M_RelationshipTypes,
  M_Status,
  M_Timestamp,
  M_rContentRating,
} from "./static-data";

export type MangaSearchResult = {
  id: string;
  type: M_RelationshipTypes;
  attributes: {
    title: M_MultiLang;
    altTitles: M_MultiLang[];
    description: M_MultiLang;
    isLocked: boolean;
    links: M_LinkField;
    originalLanguage: M_LangCodes;
    lastVolume: string;
    lastChapter: string;
    publicationDemographic: M_Demographic | null;
    status: M_Status;
    year: number;
    contentRating: M_rContentRating;
    tags: {
      id: string;
      type: M_RelationshipTypes;
      attributes: {
        name: M_MultiLang;
        description: M_MultiLang;
        group: string;
        version: number;
      };
      relationships: unknown[];
    }[];
    state: string; // enum?
    chapterNumbersResetOnNewVolume: boolean;
    createdAt: M_Timestamp;
    updatedAt: M_Timestamp;
    version: number;
    availableTranslatedLanguages: M_LangCodes[];
    latestUploadedChapter: M_Timestamp;
  };
  relationships: {
    id: string;
    type: M_RelationshipTypes;
    related: M_Related;
    attributes?: {
      // only on 'cover_art' types; @todo: fix type
      createdAt: M_Timestamp;
      description: string;
      fileName: string;
      locale: M_LangCodes;
      uploadedAt: M_Timestamp;
      version: number;
      volume: `${number}` | string;
    };
  }[];
};
