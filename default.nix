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
      # build
      tsc

      # modify entry-points
      pushd dist
        mv mangadex.js mangadex.js.tmp
        echo "#!${config.deps.nodejs}/bin/node" > mangadex.js
        cat mangadex.js.tmp >> mangadex.js
        rm mangadex.js.tmp
        chmod -R +x ./*.js
        patchShebangs .
      popd
    '';
  };

  name = lib.mkForce "mangadex";
  version = lib.mkForce "0.1.0";

  mkDerivation = {
    src = lib.cleanSource ./.;
    checkPhase = ''
      ./dist/mangadex.js | ${config.deps.gnugrep}/bin/grep -q "Hello, Mangadex!"
    '';
    doCheck = true;
  };
}
