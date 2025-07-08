{
  pkgs ? import <nixpkgs> { },
}:

pkgs.mkShell {
  buildInputs = [
    pkgs.nodejs
    pkgs.npm-check-updates
  ];

  shellHook = ''
    echo "Development environment ready. You can use node now."
  '';
}
