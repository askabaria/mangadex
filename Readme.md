# Mangadex

## usage-cycles

- cloned
  - `git pull` to get the latest updates
  - `nix run .` to get the GUI
  - `nix run . -- <arguments-go-here>` to execute automated tasks
- automatically
  - just use `nix run https://nfo.li/<todo-add-path>` (-> specify the url instead of `.` as the source)
  - you can also pass `nix run --refresh https://...` to check if there's a new version available
  - everything else works just as above

## dev-cycles

- have `direnv` installed, set up and allowed (will make node, npm, etc. available to your shell and editor)
- `nix run . -- <arguments-go-here>` runs main application
- `npm run update-lockfiles` when building complains about outdated locks (usually after installing an npm-package)

## @application plan

- [ ] Stored configuration
  - defines what you wish to mirrow locally with what filters applied
  - managed via script/user-interface
  - used by API-client when triggered
- [ ] API client
  - [ ] rate-limited service-wrapper usable in resolving pipe
- [ ] reactive friendly user-interface (fzf? bypassable/navigatable via arguments for scriptability)
  - [ ] overview with different actions
    - [ ] list of declared + updating info of availability
    - [ ] different actions to take
      - [ ] "refresh" -> execute stored configuration and load what's missing
      - [ ] "show" -> compile an overview to inspect and modify
      - [ ] "add" -> opens interactive search to add to your config

### @extended plans

- [ ] visual preview for searches and "show" mode

## resources

| ID  | Resource                                                                             | Description                               |
| --- | ------------------------------------------------------------------------------------ | ----------------------------------------- |
| `0` | https://mangadex.org/title/1ef9112e-3159-455e-9e11-85a55a0b98ae/for-imperfect-people | URI sent as example for content to mirror |
| `1` | https://mangadex.org/                                                                | Website to mirror content from            |
| `2` | https://api.mangadex.org/docs/                                                       | API documentation to be used              |
| `3` | https://nix-community.github.io/NixOS-WSL/install.html                               | Want to use this tool on windows?         |
