local chapters = {
  {id = "H01", label = "LoRA &amp; scaling"},
  {id = "L38", label = "Capacity"},
  {id = "L205", label = "Share"},
  {id = "L91", label = "Merge"},
  {id = "L94", label = "Deploy"},
  {id = "L92", label = "Appendix"},
}

local function chapter_links(current, mobile)
  local parts = {}
  for _, chapter in ipairs(chapters) do
    local present = chapter.id == current and ' aria-current="step"' or ''
    local class = mobile and '' or ' class="lora-nav-chapter"'
    local link = string.format('<a%s href="#/%s"%s>%s</a>', class, chapter.id, present, chapter.label)
    parts[#parts + 1] = mobile and '<li>' .. link .. '</li>' or link
  end
  return table.concat(parts)
end

local function navigation(identifier, current)
  return pandoc.RawBlock("html", table.concat({
    '<nav class="lora-nav" aria-label="Lecture chapters">',
    chapter_links(current, false),
    '<details class="lora-mobile-menu"><summary>All chapters</summary><ul>',
    chapter_links(current, true),
    '</ul></details></nav>',
    '<span class="lora-slide-id">' .. identifier .. '</span>',
  }))
end

function Pandoc(document)
  if FORMAT ~= "revealjs" then
    return
  end

  local starts = {}
  for _, chapter in ipairs(chapters) do
    starts[chapter.id] = true
  end
  local current = chapters[1].id
  local blocks = pandoc.List()
  for _, block in ipairs(document.blocks) do
    blocks:insert(block)
    if block.t == "Header" and block.level == 2 and block.classes:includes("lora-slide") then
      local identifier = block.identifier
      if not identifier:match("^[HL]%d%d%d?$") then
        error("Invalid LoRA slide ID: " .. identifier)
      end
      if identifier == "H01" then
        block.attributes["background-color"] = "#0a0a0a"
      end
      if starts[identifier] then
        current = identifier
      end
      blocks:insert(navigation(identifier, current))
    end
  end
  document.blocks = blocks

  return document:walk({
    Link = function(link)
      -- The Reveal writer adds the slash to internal Markdown links.
      link.target = link.target:gsub("^#/([HL]%d+)$", "#%1")
      return link
    end,
    Header = function(header)
      -- Keep lower-level headings inside the slide rather than creating
      -- nested sections that Reveal treats as vertical slide stacks.
      if header.level > 2 then
        local attributes = pandoc.Attr(
          "", {"lora-subhead"},
          {role = "heading", ["aria-level"] = tostring(header.level)})
        return pandoc.Div({pandoc.Plain(header.content)}, attributes)
      end
    end,
  })
end
