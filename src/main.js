/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
   // purchase — это одна из записей в поле items из чека в data.purchase_records
   // _product — это продукт из коллекции data.products
   const { discount, sale_price, quantity } = purchase;
   const revenue = (1 - discount / 100) * sale_price * quantity;
   return revenue;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;
    if (index === 0) {
        return profit * 0.15;
    }
    if (index === 1 || index === 2) {
        return profit * 0.1;
    }
    if (index === total - 1) {
        return 0;
    }
    return profit * 0.05;
}

// Функция для проверки входных данных
function checkData(data) {
    if (!data
        || !Array.isArray(data.customers)
        || !Array.isArray(data.products)
        || !Array.isArray(data.sellers)
        || !Array.isArray(data.purchase_records)
        || data.customers.length === 0
        || data.products.length === 0
        || data.sellers.length === 0
        || data.purchase_records.length === 0
    ) {
        throw new Error ('Некорректные входные данные');
    }
}

function checkOptions(options) {
    /*
    Функция для проверки опций
    */ 
    if (typeof options.calculateRevenue !== 'function'
        || typeof options.calculateBonus !== 'function'
    ) {
        throw new Error('Чего-то не хватает');
    }
    return options;
}

function createSellerStatsList(data) {
    /* 
    Создает список продавцов и возвращает его
     */
    return data.sellers.map(seller => {
        return {
            id: seller.id,
            name: `${seller.first_name} ${seller.last_name}`,
            revenue: 0,
            profit: 0,
            sales_count: 0,
            products_sold: {}
        }
    }); 
}

function indexListBy(list, key) {
    /*
    Делает из списка словарь по какому-то ключу
    */
    return list.reduce((result, item) => {
        return {
            ...result,
            [item[key]]: item
        }
    }, {});
}

// Функция формирования топ 10 продуктов
function addTop10Products(seller) {
    const products_sold = seller.products_sold;
    seller.top_products = Object.entries(products_sold).map(product => {
        return {
            'sku': product[0],
            'quantity': product[1]
        }
    });
    seller.top_products.sort((a, b) => b.quantity - a.quantity);
    seller.top_products = seller.top_products.slice(0, 10);
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    checkData(data);

    // @TODO: Проверка наличия опций
    const { calculateRevenue, calculateBonus } = checkOptions(options);

    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = createSellerStatsList(data);

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = indexListBy(sellerStats, 'id');

    const productIndex = indexListBy(data.products, 'sku');


    // @TODO: Расчет выручки и прибыли для каждого продавца
    // Перебор чеков и покупок в них
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        seller.sales_count += 1;
        seller.revenue += record.total_amount;
        record.items.forEach((item) => {
            const product = productIndex[item.sku];
            // Считаем себестоимость
            const cost = product.purchase_price * item.quantity;
            // Считаем выручку
            const revenue = calculateRevenue(item, product);
            // Считаем прибыль
            const profit = revenue - cost;
            seller.profit += profit;

            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0
            }
            seller.products_sold[item.sku] += item.quantity;
        })
    })
    

    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);

    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller);
        addTop10Products(seller);
    });
    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
    }))
}
