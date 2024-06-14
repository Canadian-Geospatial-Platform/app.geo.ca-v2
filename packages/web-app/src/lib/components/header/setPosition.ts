export function setPosition(node: any) {
  let nodeBounding;
  let nodeLeft;
  let nodeRight;
  let nodeWidth;
  let windowWidth;
  let transformX;
  let transformed;

  let observer = new MutationObserver(function(){
    /***********************************************************************
    *  Note: The 'shifted' class will act as a flag to indicate if the
    *  node has already been shifted or not to prevent an infinate loop.
    * 
    *  It will be removed when the window has been resized to set the new
    *  translate value, and readded at the end of the calcPosition method.
    ************************************************************************/
    if(
      window.getComputedStyle(node, null).display != 'none' &&
      !node.classList.contains('shifted')
    ){
      calcPosition();
    }
  });

  function handleResize() {
    node.classList.remove('shifted');
  }

  function calcPosition() {
    // Reset default transform value
    nodeBounding = node.getBoundingClientRect();
    nodeWidth = nodeBounding.width;
    transformX = 0 - (nodeWidth/2);
    node.style.transform = "translate(" + transformX + "px, 0px)";

    // Get the new bounding rectangle after transform
    nodeBounding = node.getBoundingClientRect();
    nodeLeft = nodeBounding.left;
    nodeRight = nodeBounding.right;
    windowWidth = window.innerWidth;
    transformed = false;

    // Set horizontal translation if node is off screen
    if (nodeLeft < 0) {
      transformX = 5 - nodeLeft - (nodeWidth/2);
      transformed = true;
    }

    // Transform node position if needed.
    if (transformed) {
      node.style.transform = "translate(" + transformX + "px, 0px)";
    }

    // Add 'shifted' class to avoid infinate loop
    node.classList.add('shifted');
  }

  observer.observe(node, { attributes: true, childList: true });
  window.addEventListener("resize", handleResize);

  return {
    destroy() {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
    }
  };
}