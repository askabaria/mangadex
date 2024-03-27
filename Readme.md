# Mangadex

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

## resources

| ID  | Resource                                                                             | Description                               |
| --- | ------------------------------------------------------------------------------------ | ----------------------------------------- |
| `0` | https://mangadex.org/title/1ef9112e-3159-455e-9e11-85a55a0b98ae/for-imperfect-people | URI sent as example for content to mirror |
| `1` | https://mangadex.org/                                                                | Website to mirror content from            |
| `2` | https://api.mangadex.org/docs/                                                       | API documentation to be used              |
| `3` | https://nix-community.github.io/NixOS-WSL/install.html                               | Want to use this tool on windows?         |
