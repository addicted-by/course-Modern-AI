-- One build-time component: no client-side rendering or duplicated slide markup.
-- Add content to recaps.json, then use a .data-recap Div with data-section=<key>.
local directory = pandoc.path.directory(PANDOC_SCRIPT_FILE)
local file = assert(io.open(pandoc.path.join({directory, 'recaps.json'}), 'r'))
local data = pandoc.json.decode(file:read('*a'))
file:close()

local function escape(value)
  return tostring(value):gsub('&', '&amp;'):gsub('<', '&lt;'):gsub('>', '&gt;'):gsub('"', '&quot;')
end

function Div(div)
  local progress_only = div.classes:includes('data-progress-only')
  if not progress_only and not div.classes:includes('data-recap') then return nil end
  local recap = not progress_only and assert(data.recaps[div.attributes['data-section']], 'Unknown recap section')
  local current = progress_only and (assert(tonumber(div.attributes['data-completed']), 'Completed count required') + 1)
    or assert(math.tointeger(recap.current), "Recap index must be an integer")
  if not progress_only then assert(#recap.points == 3, 'A recap needs exactly three learning points') end
  local out = {}
  local function add(value) out[#out + 1] = value end
  local count = 0
  for _ in pairs(data.recaps) do count = count + 1 end
  if progress_only then
    add('<div class="data-progress-only">')
  else
  add('<div class="fv-meta"><span class="fv-id">RECAP ' .. current .. ' / ' .. count .. '</span>')
  for _, cluster in ipairs({'Architecture', 'Data', 'Training', 'Inference', 'Tools'}) do
    add('<span class="fv-cluster' .. (cluster == 'Data' and ' active' or '') .. '">' .. cluster .. '</span>')
  end
  add('</div><div class="fv-body recap-layout">')
  end
  add('<nav class="recap-progress" aria-label="Data roadmap progress"><ol>')
  for index, category in ipairs(data.categories) do
    local state = index < current and 'done' or (index == current and not progress_only and 'current' or 'future')
    add('<li class="recap-topic recap-' .. state .. '"' .. (state == 'current' and ' aria-current="step"' or '') .. '>')
    add('<span class="recap-icon" aria-hidden="true">' .. (state == 'done' and '✓' or category.icon) .. '</span>')
    add('<div><span class="recap-topic-title">' .. escape(category.title) .. '</span>')
    if state == 'done' then
      assert(category.summary ~= '', 'Completed topic needs a summary')
      add('<p class="recap-summary">' .. escape(category.summary) .. '</p>')
    end
    add('</div></li>')
  end
  add('</ol></nav>')
  if progress_only then
    add('</div>')
    return pandoc.RawBlock('html', table.concat(out, '\n'))
  end
  add('<div class="recap-main"><h3 class="recap-heading">' .. escape(data.categories[current].title) .. ' <span>— what we learned</span></h3><ol class="recap-points">')
  for index, point in ipairs(recap.points) do
    local fragment = index > 1 and (' fragment" data-fragment-index="' .. (index - 1)) or ''
    add('<li class="recap-point' .. fragment .. '"><span class="recap-number" aria-hidden="true">0' .. index .. '</span><div><h4>' .. escape(point.title) .. '</h4><p class="recap-evidence">' .. escape(point.evidence) .. '</p></div><span class="recap-refs">')
    for _, link in ipairs(point.links or {{target = point.target, ref = point.ref}}) do
      add('<a class="recap-ref" href="#/' .. escape(link.target) .. '">' .. escape(link.ref) .. '</a>')
    end
    add('</span></li>')
  end
  add('</ol><div class="fv-takeaway fragment" data-fragment-index="3">' .. escape(recap.takeaway) .. '</div></div></div>')
  add('<div class="fv-source">' .. escape(recap.source) .. '</div>')
  return pandoc.RawBlock('html', table.concat(out, '\n'))
end
