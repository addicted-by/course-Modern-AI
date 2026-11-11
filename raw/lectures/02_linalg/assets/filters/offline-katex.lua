-- Render math at build time and embed KaTeX's CSS, fonts and dynamic runtime.
-- Metadata contract: offline-katex-dir points to a local KaTeX dist directory,
-- relative to the Quarto source (or plain Pandoc's working directory), for
-- example vendor/katex/dist. Its parent directory must also contain LICENSE.
-- Requires Node.js on PATH; does not need npm packages or network access.

local function fail(message)
  error("offline-katex: " .. message, 0)
end

local function render_offline(document)
  if not (FORMAT:match("html") or FORMAT == "revealjs") then
    return document
  end

  local configured_dir = document.meta["offline-katex-dir"]
  local asset_dir = configured_dir and pandoc.utils.stringify(configured_dir) or ""
  if asset_dir == "" then
    fail("set offline-katex-dir to the local KaTeX dist directory")
  end
  if quarto and quarto.doc and quarto.doc.input_file
      and not pandoc.path.is_absolute(asset_dir) then
    asset_dir = pandoc.path.join({
      pandoc.path.directory(quarto.doc.input_file), asset_dir
    })
  end

  -- Pandoc's List preserves [] in JSON even for documents with no static math
  -- (which can still have formulas in interactive overlays).
  local formulas = pandoc.List({})
  local raw_html = pandoc.List({})
  local function collect_raw(element)
    if element.format == "html" then
      raw_html[#raw_html + 1] = element.text
    end
  end
  document:walk({
    Math = function(element)
      formulas[#formulas + 1] = {
        tex = element.text,
        displayMode = element.mathtype == "DisplayMath"
      }
    end,
    RawBlock = collect_raw,
    RawInline = collect_raw
  })

  local helper = pandoc.path.join({
    pandoc.path.directory(PANDOC_SCRIPT_FILE), "offline-katex.cjs"
  })
  local request = pandoc.json.encode({assetDir = asset_dir, math = formulas, rawHtml = raw_html})
  local success, response = pcall(pandoc.pipe, "node", {helper}, request)
  if not success then
    fail("could not render with the local Node.js helper: " .. tostring(response))
  end
  local decoded, result = pcall(pandoc.json.decode, response)
  if not decoded or type(result) ~= "table" or type(result.html) ~= "table"
      or type(result.renderedRaw) ~= "table" or #result.renderedRaw ~= #raw_html
      or type(result.head) ~= "string" or #result.html ~= #formulas then
    fail("the Node.js helper returned an invalid response")
  end
  for index, html in ipairs(result.html) do
    if type(html) ~= "string" then
      fail("the Node.js helper returned invalid HTML for formula " .. index)
    end
  end
  for index, html in ipairs(result.renderedRaw) do
    if type(html) ~= "string" then
      fail("the Node.js helper returned invalid HTML for raw fragment " .. index)
    end
  end

  -- Replace original raw fragments before introducing any new RawInline nodes
  -- for Pandoc Math. Their markup is preserved except for formula text itself.
  local raw_index = 0
  local function replace_raw(element)
    if element.format == "html" then
      raw_index = raw_index + 1
      element.text = result.renderedRaw[raw_index]
      return element
    end
  end
  document = document:walk({RawBlock = replace_raw, RawInline = replace_raw})
  if raw_index ~= #raw_html then
    fail("the number of raw HTML fragments changed while replacing rendered math")
  end

  local index = 0
  document = document:walk({
    Math = function(element)
      index = index + 1
      local mode = element.mathtype == "DisplayMath" and "display" or "inline"
      return pandoc.RawInline("html", '<span class="math ' .. mode .. '">'
        .. result.html[index] .. '</span>')
    end
  })
  if index ~= #formulas then
    fail("the number of formulas changed while replacing rendered math")
  end

  local header = document.meta["header-includes"]
  local includes
  if header == nil then
    includes = pandoc.MetaList({})
  elseif pandoc.utils.type(header) == "List" then
    includes = header
  else
    includes = pandoc.MetaList({header})
  end
  includes:insert(pandoc.MetaBlocks({pandoc.RawBlock("html", result.head)}))
  document.meta["header-includes"] = includes
  return document
end

return {{Pandoc = render_offline}}
