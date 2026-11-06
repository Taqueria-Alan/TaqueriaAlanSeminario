"""Compare JaCoCo LINE coverage for the same explicitly selected E2 modules."""
import argparse
from pathlib import Path
from xml.etree import ElementTree as ET

def coverage(root, modules):
    values = {}
    for module in modules:
        report = root / module / "target/site/jacoco/jacoco.xml"
        node = ET.parse(report).getroot().find("counter[@type='LINE']")
        if node is None:
            raise ValueError(f"{module}: report has no LINE counter")
        values[module] = (int(node.attrib["covered"]), int(node.attrib["missed"]))
    return values

def pct(pair):
    covered, missed = pair
    if covered + missed == 0:
        raise ValueError("Coverage denominator is zero")
    return 100 * covered / (covered + missed)

p = argparse.ArgumentParser()
p.add_argument("baseline", type=Path)
p.add_argument("candidate", type=Path)
p.add_argument("modules", nargs="+", help="Same relative module paths registered in E2")
a = p.parse_args()
if len(set(a.modules)) != len(a.modules):
    p.error("Duplicate module")
old, new = coverage(a.baseline, a.modules), coverage(a.candidate, a.modules)
for m in a.modules:
    print(f"{m}: {pct(old[m]):.2f}% -> {pct(new[m]):.2f}% ({pct(new[m])-pct(old[m]):+.2f} pp)")
def total(xs):
    return pct(tuple(map(sum, zip(*xs.values()))))
delta = total(new) - total(old)
print(f"Weighted LINE coverage: {total(old):.2f}% -> {total(new):.2f}% ({delta:+.2f} pp)")
raise SystemExit(0 if delta >= 20 else 1)
