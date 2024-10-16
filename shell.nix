{
  pkgs ? import <nixpkgs> { },
}:

pkgs.mkShell {
  buildInputs = [
    pkgs.nodejs_22
    pkgs.npm-check-updates
  ];

  shellHook = ''
    echo "Development environment ready. You can use 'nodejs' now."
  '';
}
