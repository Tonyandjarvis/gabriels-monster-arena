#!/bin/bash

npm run test:unit
if [ $? -ne 0 ]; then
  echo "Unit tests failed!"
  exit 1
fi

npm run test:e2e
if [ $? -ne 0 ]; then
  echo "E2E tests failed!"
  exit 1
fi

echo "All tests passed!"
exit 0
