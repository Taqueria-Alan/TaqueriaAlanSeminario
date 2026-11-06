#!/usr/bin/env bash
set -euo pipefail
mkdir -p reports
mvn -B -ntp clean org.jacoco:jacoco-maven-plugin:0.8.13:prepare-agent verify org.jacoco:jacoco-maven-plugin:0.8.13:report
docker build --progress=plain --target acs-report --output type=local,dest=reports -f jenkins/Frontend.Dockerfile .
python3 - <<'PY'
from glob import glob
from xml.etree import ElementTree as ET
back = [n for f in glob("src/*-service/target/surefire-reports/TEST-*.xml") for n in ET.parse(f).iter("testcase")]
front = list(ET.parse("reports/vitest.xml").iter("testcase"))
def passed(cases):
    return sum(all(c.find(tag) is None for tag in ("failure", "error", "skipped")) for c in cases)
b, f = passed(back), passed(front)
print(f"ACS unit tests passed: backend={b}; frontend={f}; total={b+f}")
assert b and f and b + f >= 30 and b == len(back) and f == len(front)
PY
