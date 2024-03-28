# Data Strcture descriptions

## planned interactive pathes

- search -> create new or open recent
  - keybindungs for including/excluding tags (+ overview at top)
  - debounced query for when user is typing to re-populate the list
- on selection of result -> open actions
  - add/remove from subscriptions
  - modify subscription-settings (eg. languages, set bounds for what chapters/pages/etc. to download)

-

## abstract API description

```tree
/manga
  ?title=string -> to search for titles
  /tag -> get a list of tag->id mappings to include/excude tags in your search
```
