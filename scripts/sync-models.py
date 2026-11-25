#!/usr/bin/env python3
"""Update the local model database from explicitly bound presentation slides."""
import argparse
import json
from pathlib import Path
from model_catalog import sync_catalog


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1])
    parser.add_argument('--database',type=Path,help='Authoritative SQLite path (relative to root or absolute)')
    args=parser.parse_args()
    try:
        stats=sync_catalog(args.root,args.database)
    except (ValueError,OSError) as exc:
        parser.exit(1,f'Model catalog: {exc}\n')
    print(json.dumps(stats,ensure_ascii=False))


if __name__=='__main__':
    main()
