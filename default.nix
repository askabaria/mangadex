{
  lib,
  config,
  dream2nix,
  ...
}: {
  imports = [
    dream2nix.modules.dream2nix.nodejs-package-json-v3
    dream2nix.modules.dream2nix.nodejs-granular-v3
  ];

  deps = {nixpkgs, ...}: {
    inherit
      (nixpkgs)
      gnugrep
      stdenv
      ;
  };

  nodejs-granular-v3 = {
    buildScript = ''
      tsc ./mangadex.ts
      mv mangadex.js mangadex.js.tmp
      echo "#!${config.deps.nodejs}/bin/node" > mangadex.js
      cat mangadex.js.tmp >> mangadex.js
      chmod +x ./mangadex.js
      patchShebangs .
    '';
  };

  name = lib.mkForce "mangadex";
  version = lib.mkForce "0.1.0";

  mkDerivation = {
    src = lib.cleanSource ./.;
    checkPhase = ''
      ./mangadex.js | ${config.deps.gnugrep}/bin/grep -q "Hello, Mangadex!"
    '';
    doCheck = true;
  };
}
