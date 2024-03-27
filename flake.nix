{
  description = "Mangadex offline mirror";
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    dream2nix.url = "github:nix-community/dream2nix";
  };
  outputs = { self, dream2nix, nixpkgs, ... }@inputs:
    let
      system = "x86_64-linux";
    in
    {
      ### @todo: check the following; create callable packages
      # All packages defined in ./packages/<name> are automatically added to the flake outputs
      # e.g., 'packages/hello/default.nix' becomes '.#packages.hello'
      packages.${system}.default = dream2nix.lib.evalModules {
        packageSets.nixpkgs = inputs.dream2nix.inputs.nixpkgs.legacyPackages.${system};
        modules = [
          ./default.nix
          {
            paths.projectRoot = ./.;
            paths.projectRootFile = "flake.nix";
            paths.package = ./.;
          }
        ];
      };
    };
}
