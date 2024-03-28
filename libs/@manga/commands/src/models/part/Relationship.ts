import { M_LangCodes, M_Related, M_RelationshipTypes, M_Timestamp } from "../static-data";

export type M_Relation = {
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
};
