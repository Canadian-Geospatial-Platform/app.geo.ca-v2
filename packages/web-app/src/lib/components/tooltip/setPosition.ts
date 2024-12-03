export function setPosition(node: any) {
  /***
   * The purpose of this function is to ensure that the tooltip does not flow
   * off the page on small screens. Vertical or horizontal translations are
   * applied if the default position causes the tooltip to overflow.
  */
  let parentNode = node.parentNode;

  let nodeBounding;
  let nodeLeft;
  let nodeRight;
  let nodeTop;
  let nodeBottom;
  let windowWidth;
  let windowHeight;
  let bottomPadding;
  let transformX;
  let transformY;
  let transformed;

  function handleMouseover() {
    calcPosition();
  };

  function handleFocus() {
    calcPosition();
  };

  function calcPosition() {
    // Reset node position to default
    node.style.transform = "translate(0rem, 0rem)";

    nodeBounding = node.getBoundingClientRect();
    nodeLeft = nodeBounding.left;
    nodeRight = nodeBounding.right;
    nodeTop = nodeBounding.top;
    nodeBottom = nodeBounding.bottom;
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;
    bottomPadding = windowHeight * 0.1 - 35;
    transformX = 0;
    transformY = 0;
    transformed = false;

    // Set horizontal translation if node is off screen
    if (nodeLeft < 0) {
      transformX = 5 - nodeLeft;
      transformed = true;
    } else if (nodeRight > windowWidth) {
      transformX = (windowWidth - nodeRight) - 5;
      transformed = true;
    }

    // Set vertical translation if node is off screen
    if (nodeBottom > windowHeight) {
      transformY = -(nodeBottom - windowHeight) - bottomPadding;
      transformed = true;
    } else if (nodeTop < 45) {
      transformY = 0;
      transformed = true;
    }

    // Transform node position if needed.
    if (transformed) {
      node.style.transform = "translate(" + transformX + "px, " + transformY + "px)";
    }
  };

  if (parentNode) {
    parentNode.addEventListener("mouseover", handleMouseover);
    parentNode.addEventListener("focus", handleFocus);
  }

  return {
    destroy() {
      if (parentNode) {
        parentNode.removeEventListener('mouseover', handleMouseover);
        parentNode.removeEventListener('focus', handleFocus);
      }
    }
  };
}