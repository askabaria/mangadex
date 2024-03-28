/**
 * @see https://api.mangadex.org/docs/3-enumerations/
 */
type Letter =
  | "a"
  | "b"
  | "c"
  | "d"
  | "e"
  | "f"
  | "g"
  | "h"
  | "i"
  | "j"
  | "k"
  | "l"
  | "m"
  | "n"
  | "o"
  | "p"
  | "q"
  | "r"
  | "s"
  | "t"
  | "u"
  | "v"
  | "w"
  | "x"
  | "y"
  | "z";
type sCode = `${Letter}${Letter}`;
export type M_LangCodes = sCode | `${sCode}-${string}`;
export type M_Timestamp = string;

export type M_Demographic = "shounen" | "shoujo" | "josei" | "seinen";

export type M_Status = "ongoing" | "completed" | "hiatus" | "cancelled";

export type M_ReadStatus =
  | "reading"
  | "on_hold"
  | "plan_to_read"
  | "dropped"
  | "re_reading"
  | "completed";

export type M_rContentRating =
  | "safe"
  | "suggestive"
  | "erotica"
  | "pornographic";

export type M_OOP_Manga =
  | "title"
  | "year"
  | "createdAt"
  | "updatedAt"
  | "latestUploadedChapter"
  | "followedCount"
  | "relevance";

export type M_OOP_Chapter =
  | "createdAt"
  | "updatedAt"
  | "publishAt"
  | "readableAt"
  | "volume"
  | "chapter";

export type M_ListVisibility = "public" | "private";

export type M_RelationshipTypes =
  | "manga"
  | "chapter"
  | "cover_art"
  | "author"
  | "artist"
  | "scanlation_group"
  | "tag"
  | "user"
  | "custom_list";

/**
 * @todo: helper fn to turn into usable fq-uri
 */
export type M_LinkField = {
  al: string;
  ap: string;
  bw: string;
  mu: string;
  nu: string;
  kt: string;
  amz: string;
  ebj: string;
  mal: string;
  cdj: string;
  raw: string;
  engtl: string;
};

export type M_Related =
  | "monochrome"
  | "colored"
  | "preserialization"
  | "serialization"
  | "prequel"
  | "sequel"
  | "main_story"
  | "side_story"
  | "adapted_from"
  | "spin_off"
  | "based_on"
  | "doujinshi"
  | "same_franchise"
  | "shared_universe"
  | "alternate_story"
  | "alternate_version";

export type M_UserRoles =
  | "ROLE_ADMIN"
  | "ROLE_BANNED"
  | "ROLE_CONTRIBUTOR"
  | "ROLE_DESIGNER"
  | "ROLE_DEVELOPER"
  | "ROLE_FORUM_MODERATOR"
  | "ROLE_GLOBAL_MODERATOR"
  | "ROLE_GROUP_LEADER"
  | "ROLE_GROUP_MEMBER"
  | "ROLE_GUEST"
  | "ROLE_MEMBER"
  | "ROLE_MD_AT_HOME"
  | "ROLE_POWER_UPLOADER"
  | "ROLE_PUBLIC_RELATIONS"
  | "ROLE_STAFF"
  | "ROLE_UNVERIFIED"
  | "ROLE_USER"
  | "ROLE_VIP";

export type M_MultiLang = Record<M_LangCodes, string>;
