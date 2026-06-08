{
  description = "Mangadex offline mirror";
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    dream2nix.url = "github:nix-community/dream2nix";
  };
  outputs = {
    self,
    dream2nix,
    nixpkgs,
    ...
  } @ inputs: let
    system = "x86_64-linux";
    pkgs = inputs.nixpkgs.legacyPackages.${system};
  in {
    ### @todo: check the following; create callable packages
    # All packages defined in ./packages/<name> are automatically added to the flake outputs
    # e.g., 'packages/hello/default.nix' becomes '.#packages.hello'
    packages.${system} = {
      default = dream2nix.lib.evalModules {
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
      pdfcat = pkgs.writers.writeFishBin "merger.fish" (let
        exe = name: pkgs.lib.getExe pkgs.${name};
        exe' = package: name: pkgs.lib.getExe' pkgs.${package} name;
      in ''
        set OUTPUT "merged.pdf"
        set INPUTS

        for arg in $argv
          if test -f "$arg"
            echo set --append INPUTS "$arg"
            set --append INPUTS "$arg"
          else
            set OUTPUT "$arg"
          end
        end

        ${exe' "ghostscript" "gs"} -dNOPAUSE -sDEVICE=pdfwrite -sOUTPUTFILE=$OUTPUT -dBATCH $INPUTS
      '');
      merger = pkgs.writers.writeFishBin "merger.fish" (let
        exe = name: pkgs.lib.getExe pkgs.${name};
        exe' = package: name: pkgs.lib.getExe' pkgs.${package} name;
        find = exe' "findutils" "find";
      in ''
        set GLOBALARGS $argv

        set doHelp (contains -- "--help" $argv ;and echo "true" ;or echo "false")
        function dArg -a name defValue comment
          set param "--$(string lower -- $name | string replace --all "_" "-")"
          if contains -- "$param" $GLOBALARGS
            set checkNow false
            for a in $GLOBALARGS
              if $checkNow
                set -g $name "$a"
                break
              end
              if [ "$a" = "$param" ]
                if [ "$defValue" = "true" ]
                  set -g $name false
                  break
                end
                if [ "$defValue" = "false" ]
                  set -g $name true
                  break
                end
                set checkNow true
              end
            end
          end
          set extra (set -q $name ;and echo "!" ;or echo " ")
          set -q $name ;or set -g $name "$defValue"
          if $doHelp
            set val "$$name"
            if [ "$val" != "$defValue" ]
              set val "(default: $defValue) $$name"
            end
            set nameWidth 20
            set valWidth 50
            echo "[$(string pad --width $nameWidth $name)]: [$(string pad --width $valWidth $val | string shorten --no-newline --left --max $valWidth)]$extra $comment"
          end
        end

        dArg DRY_RUN false "don't do anything"
        dArg TARGET "/mnt/d/Mangaaa/01-New\ downloads/" "working directory"
        dArg LANGUAGE "*" "languages to work on, either * for all, or en/de/..."
        dArg FILTER "" "filter to only run on certain mangas"
        dArg SKIP_DOUBLE_PAGES false "dont split double-pages"
        dArg SHOW_RATIO false "DEBUG: show calculated ratio of page"
        dArg EVEN_ODD false "toggle filler-page alignment between even-odd pages for split double-pages"
        dArg NO_EVEN_ODD false "disable filler-behavoir (white page with size of first page)"
        dArg DOUBLE_PAGE_FACTOR 1 "factor, if over x times wider than average non-double -> will be considered double-page"

        if $doHelp
          exit 1
        end

        set SEARCHPATHS (${exe "fish"} -c "echo $TARGET/$LANGUAGE")

        set FND
        for candidate in (${find} $SEARCHPATHS -mindepth 1 -maxdepth 1)
          if [ "$FILTER" != "" ]
            set -l matches false
            for try in (string split ";" -- $FILTER)
              if string match --quiet --entire --ignore-case "$try" -- $candidate
                set matches true
              end
            end
            if not $matches
              continue
            end
          end
          set -a FND "$candidate"
        end

        set width
        set height
        set pagenum 0
        set TOMERGE
        set TOCLEAN

        function createWhite
          set filename (${exe' "coreutils" "mktemp"} --suffix -white.png)
          set -a TOCLEAN "$filename"
          not $DRY_RUN && ${exe' "imagemagick" "magick"} -size $width'x'$height xc:white "$filename"
          $DRY_RUN && echo -- ${exe' "imagemagick" "magick"} -size $width'x'$height xc:white \"$filename\"
          # not $DRY_RUN && ${exe "ffmpeg"} -hide_banner -loglevel error -y -f lavfi -i color=c=white:s=$width'x'$height:d=1 -frames:v 1 "$filename"
          # $DRY_RUN && echo -- ${exe "ffmpeg"} "-hide_banner -loglevel error -y -f lavfi -i color=c=white:s=$width'x'$height:d=1 -frames:v 1" \"$filename\"
          set -a TOMERGE "$filename"
        end
        function preparePage -a page
          set ratio (getRatio "$page")
          if $SHOW_RATIO
            echo "Page Ratio: $ratio @ $page"
          end

          if [ $ratio -ge $DOUBLE_PAGE_FACTOR ] && not $SKIP_DOUBLE_PAGES
            not $DRY_RUN && echo "DETECTED WIDE $page"
            set ext (path extension "$page")
            set left "$page.left$ext"
            set right "$page.right$ext"
            not $DRY_RUN && ${exe "ffmpeg"} -hide_banner -loglevel error -y -i $page -filter_complex "[0]crop=iw/2:ih:0:0[left];[0]crop=iw/2:ih:ow:0[right]" -map "[left]" $left -map "[right]" $right
            $DRY_RUN && echo -- ${exe "ffmpeg"} '-hide_banner -loglevel error -y -i' \"$page\" '-filter_complex "[0]crop=iw/2:ih:0:0[left];[0]crop=iw/2:ih:ow:0[right]" -map "[left]"' \"$left\" -map \"[right]\" \"$right\"

            set C_SIGN ([ (math "$pagenum%2") -eq 1 ] ;and echo true ;or echo false)
            if [ "$C_SIGN" = "$EVEN_ODD" ]
              createWhite
            end

            set -a TOMERGE "$left" "$right"
            set -a TOCLEAN "$left" "$right"
            return
          end
          set -a TOMERGE "$page"
        end

        function getSize -a page
          ${exe' "ffmpeg" "ffprobe"} -v error -select_streams v -show_entries stream=width,height -of csv=p=0:s=x "$page"
        end
        function getRatio -a page
          set size (getSize "$page")
          math "$(string split x $size | head -n 1)/$(string split x $size | tail -n 1)"
        end

        not $DRY_RUN && echo "Merging..."
        for cand in $FND
          not $DRY_RUN && echo ">>> $cand"
          pushd $cand
          $DRY_RUN && echo pushd \"$cand\"
            set chapters (${find} . -mindepth 1 -maxdepth 1 -type d | sort -V)
            for chapter in $chapters
              set width
              set height
              set pagenum 0
              pushd "$chapter"
              $DRY_RUN && echo pushd \"$chapter\"
                not $DRY_RUN && echo "CHAPTER: $chapter"
                set TOMERGE
                set TOCLEAN
                set pages (${find} . -mindepth 1 -maxdepth 1 | sort -V | egrep -v "\.pdf\$")
                for page in $pages
                  set pagenum (math "$pagenum+1")
                  if [ "$width" = "" ]
                    set size (getSize "$page")
                    set width (string split x $size | head -n 1)
                    set height (string split x $size | tail -n 1)
                  end
                  preparePage (realpath "$page")
                end
                not $DRY_RUN && echo "PAGES TO MERGE: [$(count $TOMERGE) / $(count $pages) => ($(math (count $TOMERGE)-(count $pages)) double pages)]"
                set -l M_PAGES
                for page in $TOMERGE
                  not $DRY_RUN && echo "preparing page $page @ $chapter | $cand"
                  set nname "$page.pdf"
                  not $DRY_RUN && ${exe' "imagemagick" "magick"} "$page" "$nname"
                  $DRY_RUN && echo -- ${exe' "imagemagick" "magick"} \"$page\" \"$nname\"




                  set -a TOCLEAN "$nname"
                  set -a M_PAGES "$nname"
                end
              popd
              $DRY_RUN && echo popd
              not $DRY_RUN && ${exe' "ghostscript" "gs"} -dNOPAUSE -sDEVICE=pdfwrite -sOUTPUTFILE=$chapter.pdf -dBATCH $M_PAGES
              $DRY_RUN && echo -- ${exe' "ghostscript" "gs"} -dNOPAUSE -sDEVICE=pdfwrite -sOUTPUTFILE=$chapter.pdf -dBATCH '"'$M_PAGES'"'
              for cln in $TOCLEAN
                not $DRY_RUN && rm "$cln"
                $DRY_RUN && echo -- rm \"$cln\"
              end
            end
          $DRY_RUN && echo popd
          popd
        end
      '');
    };
  };
}
