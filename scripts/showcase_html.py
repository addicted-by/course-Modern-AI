"""Small HTML fragment tree shared by the source importer and site renderer."""
from html import escape
from html.parser import HTMLParser

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}


class Node:
    def __init__(self, tag="", attrs=()):
        self.tag, self.attrs, self.children = tag, dict(attrs), []

    def has(self, cls):
        return cls in self.attrs.get("class", "").split()

    def walk(self):
        yield self
        for child in self.children:
            if isinstance(child, Node):
                yield from child.walk()

    def find(self, cls=None, tag=None):
        return next((n for n in self.walk() if (cls is None or n.has(cls)) and (tag is None or n.tag == tag)), None)

    def text(self):
        return " ".join("".join(c.text() if isinstance(c, Node) else c for c in self.children).split())

    def html(self):
        inside = "".join(c.html() if isinstance(c, Node) else escape(c, quote=False) for c in self.children)
        if not self.tag:
            return inside
        attrs = "".join(" " + k + ("" if v is None else '="' + escape(v, quote=True) + '"') for k, v in self.attrs.items())
        return f"<{self.tag}{attrs}>" + ("" if self.tag in VOID else inside + f"</{self.tag}>")


class Fragment(HTMLParser):
    def __init__(self, content):
        super().__init__(convert_charrefs=True)
        self.root = Node()
        self.stack = [self.root]
        self.feed(content)

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                self.stack = self.stack[:i]
                break

    def handle_data(self, value):
        self.stack[-1].children.append(value)

    def handle_entityref(self, name):
        self.handle_data("&" + name + ";")


def text(node):
    return node.text() if node is not None else ""
