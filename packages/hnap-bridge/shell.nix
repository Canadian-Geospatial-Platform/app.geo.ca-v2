{
  pkgs ? import <nixpkgs> { },
}:

pkgs.mkShell {
  buildInputs = [
    pkgs.nodejs_18
  ];

  shellHook = ''
    echo "Development environment ready. "
  '';
}
