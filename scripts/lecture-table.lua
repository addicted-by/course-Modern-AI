-- The shared placeholder is expanded on both the homepage and lecture hub.
-- Read paths directly: Quarto rebases existing files in inherited metadata,
-- while catalog paths must consistently remain relative to the project root.
local function read_catalog()
  local file = assert(io.open(quarto.project.directory .. "/lectures.yml", "r"))
  local yaml = file:read("*a")
  file:close()
  return pandoc.read("---\n" .. yaml .. "\n---\n", "markdown").meta.lectures
end

local function text(value)
  return value and pandoc.utils.stringify(value) or ""
end

local function escape(value)
  return text(value):gsub("&", "&amp;"):gsub("<", "&lt;")
    :gsub(">", "&gt;"):gsub('"', "&quot;"):gsub("'", "&#39;")
end

local function material_link(lecture, format)
  local path = text(lecture[format])
  local label = format:upper()
  if path == "" then
    return '<span class="course-material-unavailable">' .. label .. ': TBA</span>'
  end
  -- Root-relative links are rewritten by Quarto for each page and site prefix.
  if not path:match("^https?://") then path = "/" .. path end
  local secondary = format == "html" and "" or " course-button-secondary"
  return '<a class="course-button course-material-link' .. secondary
    .. '" href="' .. escape(path) .. '" aria-label="'
    .. (format == "html" and "Open " or "Download ") .. label
    .. ' slides for ' .. escape(lecture.title) .. '">' .. label
    .. ' <span aria-hidden="true">↗</span></a>'
end

function Pandoc(doc)
  if not FORMAT:match("html") then return doc end
  return doc:walk({
    Div = function(div)
      if not div.classes:includes("lecture-catalog") then return nil end
      local lectures = read_catalog()
      local rows = {
        '<div class="course-lecture-table-wrap" role="region" aria-label="Lecture schedule and materials" tabindex="0">',
        '<table class="course-lecture-table" aria-label="Lecture schedule and materials">',
        '<thead><tr><th scope="col">№ / Module</th><th scope="col">Lecture</th><th scope="col">Materials</th></tr></thead>',
        '<tbody>'
      }
      for _, lecture in ipairs(lectures) do
        rows[#rows + 1] = '<tr><td><div class="course-material-index">'
          .. '<span class="course-material-number">'
          .. string.format("%02d", tonumber(text(lecture.number))) .. '</span>'
          .. '<span class="course-material-module">' .. escape(lecture.module)
          .. '</span></div></td><th scope="row"><span class="course-material-title">'
          .. escape(lecture.title) .. '</span></th><td><div class="course-material-actions">'
          .. material_link(lecture, "html") .. material_link(lecture, "pdf")
          .. material_link(lecture, "pptx") .. '</div></td></tr>'
      end
      if #lectures == 0 then
        rows[#rows + 1] = '<tr><td colspan="3">Lecture materials will be added soon.</td></tr>'
      end
      rows[#rows + 1] = '</tbody></table></div>'
      return pandoc.RawBlock("html", table.concat(rows, "\n"))
    end
  })
end
