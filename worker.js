let allItems = [];
let allTypes = [];
let itemsByType = new Map();

function buildItems(text) {
    const typeSet = new Set();

    allItems = [];
    itemsByType = new Map();

    for (let i = 0; i < text.length; i += 1) {
        const item = text[i];
        if (!item.code || !item.name || !item.type) {
            continue;
        }

        const normalizedItem = {
            code: String(item.code).trim(),
            name: String(item.name).trim(),
            type: String(item.type).trim(),
        };

        if (!normalizedItem.code || !normalizedItem.name || !normalizedItem.type) {
            continue;
        }

        normalizedItem.searchValue = `${normalizedItem.code} ${normalizedItem.name}`.toLowerCase();
        allItems.push(normalizedItem);
        typeSet.add(normalizedItem.type);

        if (!itemsByType.has(normalizedItem.type)) {
            itemsByType.set(normalizedItem.type, []);
        }

        itemsByType.get(normalizedItem.type).push(normalizedItem);
    }

    if (allItems.length === 0) {
        return;
    }

    allTypes = Array.from(typeSet).sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

function itemMatches(item, normalizedSearch, selectedType) {
    return (!normalizedSearch || item.searchValue.includes(normalizedSearch))
        && (!selectedType || item.type === selectedType);
}

function collectPageItems(normalizedSearch, selectedType, startIndex, pageSize) {
    const pageItems = [];
    let matchedTotal = 0;
    const sourceItems = selectedType ? (itemsByType.get(selectedType) || []) : allItems;

    for (let i = 0; i < sourceItems.length; i += 1) {
        const item = sourceItems[i];

        if (!itemMatches(item, normalizedSearch, selectedType)) {
            continue;
        }

        if (matchedTotal >= startIndex && matchedTotal < startIndex + pageSize) {
            pageItems.push({ code: item.code, name: item.name, type: item.type });
        }

        matchedTotal += 1;
    }

    return { matchedTotal, pageItems };
}

function filterItems({ searchText = '', selectedType = '', page = 1, pageSize = 48, requestId = 0 }) {
    const normalizedSearch = searchText.trim().toLowerCase();
    const requestedPage = Math.max(page, 1);
    const requestedStartIndex = (requestedPage - 1) * pageSize;
    let { matchedTotal, pageItems } = collectPageItems(
        normalizedSearch,
        selectedType,
        requestedStartIndex,
        pageSize
    );
    const finalTotalPages = Math.max(1, Math.ceil(matchedTotal / pageSize));
    const finalSafePage = Math.min(requestedPage, finalTotalPages);
    const finalStartIndex = (finalSafePage - 1) * pageSize;

    if (finalStartIndex !== requestedStartIndex) {
        pageItems = collectPageItems(
            normalizedSearch,
            selectedType,
            finalStartIndex,
            pageSize
        ).pageItems;
    }

    return {
        requestId,
        total: matchedTotal,
        totalPages: finalTotalPages,
        page: finalSafePage,
        pageItems
    };
}

self.onmessage = (event) => {
    const { type, payload } = event.data;

    if (type === 'load') {
        fetch('./飞车最新所有代码.json')
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                return response.json();
            })
            .then((items) => {
                buildItems(items);
                const initialResult = filterItems({ page: 1, pageSize: 48 });

                self.postMessage({
                    type: 'loaded',
                    payload: {
                        totalItems: allItems.length,
                        types: allTypes,
                        pageItems: initialResult.pageItems
                    }
                });
            })
            .catch((error) => {
                self.postMessage({
                    type: 'error',
                    payload: { message: error.message || '加载数据失败' }
                });
            });
        return;
    }

    if (type === 'filter') {
        const result = filterItems(payload);
        self.postMessage({
            type: 'filtered',
            payload: result
        });
    }
};
