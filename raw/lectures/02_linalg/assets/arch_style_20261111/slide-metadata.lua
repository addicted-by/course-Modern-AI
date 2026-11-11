-- Render the current chapter in the Architecture rail.
local chapters = {
  {"Motivation", "pre-opening"},
  {"LS", "pdf-mnk", "fa-slide"},
  {"Factorization", "pdf-decomp", "tsvd-slide", "pre-proof"},
  {"Applications", "app-slide"},
  {"ReplaceMe", "r3-slide"},
}

local function chapter_index(slide)
  if slide.identifier == "pre-25" or slide.identifier == "pre-26" then
    return 3
  end
  for index, chapter in ipairs(chapters) do
    for column = 2, #chapter do
      if slide.classes:includes(chapter[column]) then
        return index
      end
    end
  end
end

local function is_slide(block)
  return block.t == "Header" and block.level == 2 and block.classes:includes("la-slide")
end

function Pandoc(document)
  if FORMAT ~= "revealjs" then
    return
  end

  local blocks = pandoc.List({})
  for _, block in ipairs(document.blocks) do
    blocks:insert(block)
    if is_slide(block) and not block.classes:includes("fa-proof-page") then
      local active = chapter_index(block)
      local html = {
        '<div class="la-arch-meta" role="group" aria-label="Lecture chapters">',
      }
      for index, chapter in ipairs(chapters) do
        local current = index == active and ' aria-current="step"' or ''
        html[#html + 1] = '<span class="la-arch-chapter"' .. current .. '>' .. chapter[1] .. '</span>'
      end
      html[#html + 1] = '</div>'
      blocks:insert(pandoc.RawBlock("html", table.concat(html, "")))
    end
  end
  document.blocks = blocks
  return document
end
