(async () => {
  'use strict'
  function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms))
  }

  let selected: Range = null

  document.addEventListener('click', (event) => selected = document.getSelection().getRangeAt(0))

  function createHighlight(boundingRect: DOMRect, color: string) {
    const highlightElement = document.createElement('div')
    highlightElement.style.zIndex = '99999999999'
    highlightElement.style.position = 'absolute'
    highlightElement.style.pointerEvents = 'none'
    highlightElement.style.backgroundColor = color
    document.body.appendChild(highlightElement)
    highlightElement.style.width = `${boundingRect.width}px`
    highlightElement.style.height = `${boundingRect.height}px`

    highlightElement.style.left = `${boundingRect.x + document.scrollingElement.scrollLeft}px`
    highlightElement.style.top = `${boundingRect.y + document.scrollingElement.scrollTop}px`

    return highlightElement
  }

  function getNextOf(current: Node, maxDepth: number = Number.MAX_SAFE_INTEGER) {
    let depth = 0
    let next: Node = current?.nextSibling
    while (!next && current?.parentNode && ++depth < maxDepth) {
      current = current.parentNode
      next = current.nextSibling
    }
    return next
  }

  function getDeepstFirstChild(node: Node) {
    while (node?.firstChild) node = node.firstChild
    return node
  }

  let current: Node = null
  while (true) {
    let range: Range = null
    if (selected) {
      range = selected.cloneRange()
      current = getDeepstFirstChild(selected.startContainer)
      selected = null
    }
    if (!current) {
      await sleep(200)
      continue
    }

    const currentElement = current.nodeType === current.ELEMENT_NODE ? current as HTMLElement : current.parentElement

    await (async () => {
      switch (currentElement.tagName.toLowerCase()) {
        case 'style':
        case 'script':
        case 'noscript':
        case 'textarea':
          return
      }

      switch (current.nodeType) {
        case current.ELEMENT_NODE:
        case current.TEXT_NODE:
          break
        default: return
      }

      if (!current.textContent.trim()) return

      if (!range) {
        range = document.createRange()
        range.selectNode(current)
      }
      else {
        range.setEndAfter(current)
      }

      switch (currentElement.tagName.toLowerCase()) {
        case 'li':
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
        case 'p':
          break
        default:
          if (current.parentElement.nextSibling && current.parentElement.childNodes.length === 1) current = current.parentElement
          break
      }
      while (current.textContent) {
        range.setEndAfter(current)
        const next = current.nextSibling
        if (next) current = next
        else break
      }

      const currentText = range.toString().trim().replace(/\s+/g,' ').replace(/^\s+|\s+$/,'');
      if (!currentText) return

      const rangeBoundingRect = range.getBoundingClientRect()
      const parentBoundingRect = current.parentElement.getBoundingClientRect()
      const intersectingRect = new DOMRect(
        rangeBoundingRect.x > parentBoundingRect.x ? rangeBoundingRect.x : parentBoundingRect.x,
        rangeBoundingRect.y > parentBoundingRect.y ? rangeBoundingRect.y : parentBoundingRect.y,
        rangeBoundingRect.width < parentBoundingRect.width ? rangeBoundingRect.width : parentBoundingRect.width,
        rangeBoundingRect.height < parentBoundingRect.height ? rangeBoundingRect.height : parentBoundingRect.height
      )
      
      if (intersectingRect.width === 0 && intersectingRect.height === 0) return
      
      const highlight = createHighlight(intersectingRect, "rgba(47, 255, 163, .5)")
      console.log('Read:', currentText)
      await sleep(2000)
      highlight.remove()
    })()

    current = getDeepstFirstChild(getNextOf(current))
  }
})()