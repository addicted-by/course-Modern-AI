local catalog = {id = "ts-index", label = "All tools ↑"}
local groups = {
  {id = "ts-cursor", label = "IDE", evidence_prefix = "ts-evidence-ide-"},
  {id = "ts-aider", label = "Terminal", evidence_prefix = "ts-evidence-terminal-"},
  {id = "ts-codex", label = "Local &amp; Remote", evidence_prefix = "ts-evidence-remote-"},
}

local function nav_link(entry, class, current)
  local state = current and ' aria-current="' .. current .. '"' or ""
  return string.format('<a class="%s" href="#/%s"%s>%s</a>', class, entry.id, state, entry.label)
end

local function navigation(current, alternate)
  local links = {'<nav class="ts-meta ts-category-nav" aria-label="Tool categories">'}
  for _, group in ipairs(groups) do
    links[#links + 1] = nav_link(group, "ts-category", group.id == current and "location")
  end
  links[#links + 1] = nav_link(catalog, "ts-catalog-link", current == catalog.id and "page")
  if alternate then
    links[#links + 1] = nav_link(alternate, "ts-use-link")
  end
  links[#links + 1] = "</nav>"
  return pandoc.RawBlock("html", table.concat(links, "\n"))
end

local function evidence_category(id)
  for _, group in ipairs(groups) do
    if id:find(group.evidence_prefix, 1, true) == 1 then
      return group.id
    end
  end
end

local function is_slide(block)
  return block.t == "Header" and block.level == 2 and block.classes:includes("ts-slide")
end

function Pandoc(document)
  if FORMAT ~= "revealjs" then
    return document
  end

  local starts = {[catalog.id] = true}
  for _, group in ipairs(groups) do
    starts[group.id] = true
  end

  local current = catalog.id
  local slide_groups = {}
  local use_slides = {}
  local profiles = {}
  -- Profiles follow their group entry in source order. Use slides inherit the
  -- group from their profile, and the technical appendix has its own prefixes.
  for _, block in ipairs(document.blocks) do
    if is_slide(block) then
      local id = block.identifier
      if block.classes:includes("ts-uses") then
        local profile = id:match("^(ts%-.+)%-uses$")
        if not profile then error("Expected use-case slide ID ending in -uses: " .. id) end
        profiles[id] = profile
        use_slides[profile] = id
      else
        if starts[id] then current = id end
        slide_groups[id] = evidence_category(id) or current
      end
    end
  end

  local blocks = pandoc.List()
  for _, block in ipairs(document.blocks) do
    blocks:insert(block)
    if is_slide(block) then
      local id = block.identifier
      local profile = profiles[id]
      local alternate
      if profile then
        if not slide_groups[profile] then error("Missing profile for use-case slide " .. id) end
        alternate = {id = profile, label = "Features"}
      elseif use_slides[id] then
        alternate = {id = use_slides[id], label = "Use cases"}
      end
      blocks:insert(navigation(slide_groups[profile or id], alternate))
    end
  end
  document.blocks = blocks
  return document
end
