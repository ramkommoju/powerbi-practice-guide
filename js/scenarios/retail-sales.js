/* ============================================
   Scenario: Retail Sales Analytics
   FreshMart Grocery Chain
   ============================================ */

window.Scenarios = window.Scenarios || {};
window.Scenarios['retail-sales'] = (function () {

  // ── Seeded random for deterministic data ──
  let _seed = 42;
  function rand() { _seed = (_seed * 16807 + 0) % 2147483647; return (_seed - 1) / 2147483646; }
  function randInt(min, max) { return Math.floor(rand() * (max - min + 1)) + min; }
  function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
  function randomDate(start, end) {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    return new Date(s + rand() * (e - s));
  }
  function fmt(d) { return d.toISOString().slice(0, 10); }

  // ══════════════════════════════════════════
  // BUSINESS REQUIREMENTS
  // ══════════════════════════════════════════

  var businessRequirements = {
    overview: 'FreshMart is a mid-size grocery chain operating <strong>5 stores</strong> across <strong>3 cities</strong> in the United States. The management team wants to leverage Power BI to gain actionable insights into their sales operations. Currently, data lives in a transactional (OLTP) database and needs to be transformed into an analytics-friendly model.',

    stakeholders: [
      { role: 'CEO', needs: 'High-level revenue trends, profit margins, year-over-year growth' },
      { role: 'Regional Manager', needs: 'Compare store performance within their region, staffing insights' },
      { role: 'Store Manager', needs: 'Daily/weekly store performance, product mix, customer footfall' },
      { role: 'Category Manager', needs: 'Product category profitability, pricing analysis, inventory movement' }
    ],

    kpis: [
      { name: 'Total Revenue', definition: 'Sum of all net sales amounts', icon: '\ud83d\udcb0' },
      { name: 'Gross Profit', definition: 'Revenue minus cost of goods sold', icon: '\ud83d\udcb5' },
      { name: 'Profit Margin %', definition: 'Gross Profit divided by Revenue', icon: '\ud83d\udcc8' },
      { name: 'Transaction Count', definition: 'Number of unique transactions', icon: '\ud83d\uded2' },
      { name: 'Average Basket Value', definition: 'Revenue per transaction', icon: '\ud83d\udce6' },
      { name: 'Customer Count', definition: 'Unique customers who made purchases', icon: '\ud83d\udc65' }
    ],

    businessQuestions: [
      'What is the overall revenue trend over the past 12 months?',
      'Which store generates the most revenue? Which is underperforming?',
      'What are the top 5 and bottom 5 products by revenue?',
      'How does revenue compare month-over-month and year-over-year?',
      'Which product category has the highest profit margin?',
      'What is the average basket value, and how does it vary by store?',
      'Do Gold/Silver/Bronze membership customers spend differently?',
      'Are there any seasonal patterns in purchasing?',
      'What percentage of revenue comes from each product category?',
      'How many new customers joined each month?'
    ]
  };

  // ══════════════════════════════════════════
  // SOURCE DATA (OLTP)
  // ══════════════════════════════════════════

  // --- Categories ---
  var categoriesData = [
    { category_id: 1, category_name: 'Produce' },
    { category_id: 2, category_name: 'dairy' },        // intentional: lowercase
    { category_id: 3, category_name: 'Bakery' },
    { category_id: 4, category_name: 'BEVERAGES' },    // intentional: UPPERCASE
    { category_id: 5, category_name: 'Snacks' }
  ];

  // --- Subcategories ---
  var subcategoriesData = [
    { subcategory_id: 1, subcategory_name: 'Fresh Fruits', category_id: 1 },
    { subcategory_id: 2, subcategory_name: 'Vegetables', category_id: 1 },
    { subcategory_id: 3, subcategory_name: 'Organic Produce', category_id: 1 },
    { subcategory_id: 4, subcategory_name: 'Milk & Cream', category_id: 2 },
    { subcategory_id: 5, subcategory_name: 'Cheese', category_id: 2 },
    { subcategory_id: 6, subcategory_name: 'Yogurt', category_id: 2 },
    { subcategory_id: 7, subcategory_name: 'Bread', category_id: 3 },
    { subcategory_id: 8, subcategory_name: 'Pastries', category_id: 3 },
    { subcategory_id: 9, subcategory_name: 'Soft Drinks', category_id: 4 },
    { subcategory_id: 10, subcategory_name: 'Juices', category_id: 4 },
    { subcategory_id: 11, subcategory_name: 'Coffee & Tea', category_id: 4 },
    { subcategory_id: 12, subcategory_name: 'Chips', category_id: 5 },
    { subcategory_id: 13, subcategory_name: 'Cookies', category_id: 5 },
    { subcategory_id: 14, subcategory_name: 'Nuts & Trail Mix', category_id: 5 },
    { subcategory_id: 15, subcategory_name: 'Frozen Dairy', category_id: 99 }  // orphan category_id!
  ];

  // --- Products ---
  var productsData = (function () {
    var items = [
      { product_id: 1, product_name: 'Red Apples', subcategory_id: 1, brand: 'FarmFresh', cost_price: 1.20, retail_price: 2.49 },
      { product_id: 2, product_name: 'Bananas ', subcategory_id: 1, brand: 'Tropicana', cost_price: 0.40, retail_price: 0.79 },  // trailing space
      { product_id: 3, product_name: 'Strawberries', subcategory_id: 1, brand: 'BerryBest', cost_price: 2.50, retail_price: 4.99 },
      { product_id: 4, product_name: 'Broccoli', subcategory_id: 2, brand: 'GreenValley', cost_price: 1.00, retail_price: 1.99 },
      { product_id: 5, product_name: 'Carrots', subcategory_id: 2, brand: 'GreenValley', cost_price: 0.60, retail_price: 1.29 },
      { product_id: 6, product_name: 'Spinach', subcategory_id: 2, brand: 'FarmFresh', cost_price: 1.50, retail_price: 2.99 },
      { product_id: 7, product_name: 'Organic Avocados', subcategory_id: 3, brand: 'NaturePure', cost_price: 1.80, retail_price: 3.49 },
      { product_id: 8, product_name: 'Organic Kale', subcategory_id: 3, brand: 'NaturePure', cost_price: 2.00, retail_price: 3.99 },
      { product_id: 9, product_name: 'Whole Milk 1gal', subcategory_id: 4, brand: 'DairyPure', cost_price: 2.10, retail_price: 3.99 },
      { product_id: 10, product_name: 'Skim Milk 1gal', subcategory_id: 4, brand: 'DairyPure', cost_price: 1.90, retail_price: 3.79 },
      { product_id: 11, product_name: 'Cheddar Cheese Block', subcategory_id: 5, brand: 'CheeseCo', cost_price: 3.00, retail_price: 5.99 },
      { product_id: 12, product_name: 'Mozzarella Shredded', subcategory_id: 5, brand: 'CheeseCo', cost_price: 2.50, retail_price: 4.49 },
      { product_id: 13, product_name: 'Greek Yogurt', subcategory_id: 6, brand: 'YogLife', cost_price: 0.80, retail_price: 1.59 },
      { product_id: 14, product_name: 'Vanilla Yogurt 4pk', subcategory_id: 6, brand: 'YogLife', cost_price: 1.60, retail_price: 3.29 },
      { product_id: 15, product_name: 'White Bread Loaf', subcategory_id: 7, brand: 'BakersBest', cost_price: 1.00, retail_price: 2.49 },
      { product_id: 16, product_name: 'Whole Wheat Bread', subcategory_id: 7, brand: 'BakersBest', cost_price: 1.30, retail_price: 3.29 },
      { product_id: 17, product_name: 'Croissants 6pk', subcategory_id: 8, brand: 'BakersBest', cost_price: 2.20, retail_price: 4.99 },
      { product_id: 18, product_name: 'Blueberry Muffins 4pk', subcategory_id: 8, brand: 'BakersBest', cost_price: 2.00, retail_price: 4.49 },
      { product_id: 19, product_name: 'Cola 12pk', subcategory_id: 9, brand: 'FizzPop', cost_price: 3.50, retail_price: 6.99 },
      { product_id: 20, product_name: 'Lemon Sparkling Water', subcategory_id: 9, brand: 'ClearSpring', cost_price: 0.60, retail_price: 1.29 },
      { product_id: 21, product_name: 'Orange Juice 64oz', subcategory_id: 10, brand: 'Tropicana', cost_price: 2.50, retail_price: 4.99 },
      { product_id: 22, product_name: 'Apple Juice 64oz', subcategory_id: 10, brand: 'Tropicana', cost_price: 2.20, retail_price: 4.49 },
      { product_id: 23, product_name: 'Ground Coffee 12oz', subcategory_id: 11, brand: 'MorningBrew', cost_price: 4.00, retail_price: 8.99 },
      { product_id: 24, product_name: 'Green Tea Bags 20pk', subcategory_id: 11, brand: 'ZenLeaf', cost_price: 1.50, retail_price: 3.49 },
      { product_id: 25, product_name: 'Potato Chips Classic', subcategory_id: 12, brand: 'CrunchTime', cost_price: 1.50, retail_price: 3.49 },
      { product_id: 26, product_name: 'Tortilla Chips', subcategory_id: 12, brand: 'CrunchTime', cost_price: 1.40, retail_price: 3.29 },
      { product_id: 27, product_name: 'Chocolate Chip Cookies', subcategory_id: 13, brand: 'SweetBite', cost_price: 1.80, retail_price: 3.99 },
      { product_id: 28, product_name: 'Oatmeal Raisin Cookies', subcategory_id: 13, brand: 'SweetBite', cost_price: 1.70, retail_price: 3.79 },
      { product_id: 29, product_name: 'Mixed Nuts 16oz', subcategory_id: 14, brand: 'NutHouse', cost_price: 4.50, retail_price: 8.99 },
      { product_id: 30, product_name: 'Trail Mix 12oz', subcategory_id: 14, brand: 'NutHouse', cost_price: 3.00, retail_price: 5.99 },
      // Duplicate product name — data quality issue
      { product_id: 31, product_name: 'Red Apples', subcategory_id: 1, brand: 'OrchardGold', cost_price: 1.40, retail_price: 2.79 },
      // Product with null subcategory
      { product_id: 32, product_name: 'Mystery Combo Pack', subcategory_id: null, brand: 'FreshMart', cost_price: 5.00, retail_price: 9.99 },
      { product_id: 33, product_name: 'Heavy Cream 16oz', subcategory_id: 4, brand: 'DairyPure', cost_price: 1.80, retail_price: 3.49 },
      { product_id: 34, product_name: 'Butter Unsalted', subcategory_id: 5, brand: 'DairyPure', cost_price: 2.00, retail_price: 3.99 },
      { product_id: 35, product_name: 'Sourdough Bread', subcategory_id: 7, brand: 'BakersBest', cost_price: 1.80, retail_price: 4.49 }
    ];
    return items;
  })();

  // --- Stores (with geographic coordinates) ---
  var storesData = [
    { store_id: 1, store_name: 'FreshMart Downtown', address: '100 Main St', city: 'Austin', state: 'TX', region: 'South', manager_name: 'Alice Johnson', store_type: 'Urban', open_date: '2019-03-15', sqft: 12000, latitude: 30.2672, longitude: -97.7431 },
    { store_id: 2, store_name: 'FreshMart Westside', address: '250 West Blvd', city: 'Austin', state: 'TX', region: 'South', manager_name: 'Bob Smith', store_type: 'Suburban', open_date: '2020-07-01', sqft: 18000, latitude: 30.3074, longitude: -97.8935 },
    { store_id: 3, store_name: 'FreshMart Lakeside', address: '88 Lake Dr', city: 'Denver', state: 'CO', region: 'West', manager_name: 'Carol White', store_type: 'Suburban', open_date: '2020-11-10', sqft: 15000, latitude: 39.7392, longitude: -104.9903 },
    { store_id: 4, store_name: 'FreshMart Central', address: '500 Center Ave', city: 'Denver', state: 'CO', region: 'West', manager_name: 'David Lee', store_type: 'Urban', open_date: '2021-02-20', sqft: 10000, latitude: 39.7500, longitude: -105.0005 },
    { store_id: 5, store_name: 'FreshMart Plaza', address: '77 Plaza Rd', city: 'Chicago', state: 'IL', region: 'Midwest', manager_name: 'Eva Martinez', store_type: 'Urban', open_date: '2021-09-05', sqft: 14000, latitude: 41.8781, longitude: -87.6298 },
    { store_id: 6, store_name: 'FreshMart Uptown', address: '320 North Ave', city: 'New York', state: 'NY', region: 'East', manager_name: 'Frank Chen', store_type: 'Urban', open_date: '2019-06-20', sqft: 8500, latitude: 40.7128, longitude: -74.0060 },
    { store_id: 7, store_name: 'FreshMart Seaside', address: '15 Ocean Blvd', city: 'Miami', state: 'FL', region: 'South', manager_name: 'Grace Patel', store_type: 'Urban', open_date: '2022-01-10', sqft: 11000, latitude: 25.7617, longitude: -80.1918 },
    { store_id: 8, store_name: 'FreshMart Sunset', address: '900 Sunset Dr', city: 'Los Angeles', state: 'CA', region: 'West', manager_name: 'Henry Nakamura', store_type: 'Suburban', open_date: '2020-04-15', sqft: 20000, latitude: 34.0522, longitude: -118.2437 },
    { store_id: 9, store_name: 'FreshMart Peachtree', address: '450 Peachtree St', city: 'Atlanta', state: 'GA', region: 'South', manager_name: 'Irene Okafor', store_type: 'Urban', open_date: '2021-11-30', sqft: 13000, latitude: 33.7490, longitude: -84.3880 },
    { store_id: 10, store_name: 'FreshMart Harbor', address: '60 Harbor Way', city: 'Seattle', state: 'WA', region: 'West', manager_name: 'Jack Rivera', store_type: 'Suburban', open_date: '2022-05-18', sqft: 16000, latitude: 47.6062, longitude: -122.3321 }
  ];

  // City coordinates lookup (for customer geo mapping)
  var cityCoords = {
    'Austin': { lat: 30.2672, lng: -97.7431 },
    'Denver': { lat: 39.7392, lng: -104.9903 },
    'Chicago': { lat: 41.8781, lng: -87.6298 },
    'New York': { lat: 40.7128, lng: -74.0060 },
    'Miami': { lat: 25.7617, lng: -80.1918 },
    'Los Angeles': { lat: 34.0522, lng: -118.2437 },
    'Atlanta': { lat: 33.7490, lng: -84.3880 },
    'Seattle': { lat: 47.6062, lng: -122.3321 }
  };

  // --- Suppliers (new table with geographic data) ---
  var suppliersData = [
    { supplier_id: 1, supplier_name: 'Green Valley Farms', contact_name: 'Tom Harris', city: 'Sacramento', state: 'CA', country: 'USA', latitude: 38.5816, longitude: -121.4944, phone: '916-555-0101', supplies: 'Produce' },
    { supplier_id: 2, supplier_name: 'DairyPure Co-op', contact_name: 'Susan Clark', city: 'Madison', state: 'WI', country: 'USA', latitude: 43.0731, longitude: -89.4012, phone: '608-555-0202', supplies: 'Dairy' },
    { supplier_id: 3, supplier_name: 'BakersBest Inc', contact_name: 'Pierre Dupont', city: 'Philadelphia', state: 'PA', country: 'USA', latitude: 39.9526, longitude: -75.1652, phone: '215-555-0303', supplies: 'Bakery' },
    { supplier_id: 4, supplier_name: 'Pacific Beverages', contact_name: 'Lisa Wong', city: 'Portland', state: 'OR', country: 'USA', latitude: 45.5152, longitude: -122.6784, phone: '503-555-0404', supplies: 'Beverages' },
    { supplier_id: 5, supplier_name: 'CrunchTime Foods', contact_name: 'Mike Brown', city: 'Dallas', state: 'TX', country: 'USA', latitude: 32.7767, longitude: -96.7970, phone: '214-555-0505', supplies: 'Snacks' },
    { supplier_id: 6, supplier_name: 'NaturePure Organics', contact_name: 'Anna Green', city: 'San Jose', state: 'CA', country: 'USA', latitude: 37.3382, longitude: -121.8863, phone: '408-555-0606', supplies: 'Organic Produce' },
    { supplier_id: 7, supplier_name: 'Tropicana Partners', contact_name: 'Carlos Mendez', city: 'Orlando', state: 'FL', country: 'USA', latitude: 28.5383, longitude: -81.3792, phone: '407-555-0707', supplies: 'Fruits, Juices' },
    { supplier_id: 8, supplier_name: 'NutHouse Wholesale', contact_name: 'Rachel Kim', city: 'Phoenix', state: 'AZ', country: 'USA', latitude: 33.4484, longitude: -112.0740, phone: '602-555-0808', supplies: 'Nuts, Trail Mix' }
  ];

  // --- Customers (expanded to 400, with more cities) ---
  var customersData = (function () {
    var firstNames = ['James','Mary','John','Patricia','Robert','Jennifer','Michael','Linda','William','Elizabeth','David','Barbara','Richard','Susan','Joseph','Jessica','Thomas','Sarah','Charles','Karen','Emma','Liam','Olivia','Noah','Ava','Sophia','Mason','Isabella','Logan','Mia','Ethan','Harper','Aiden','Ella','Lucas','Chloe','Jackson','Lily','Sebastian','Zoey'];
    var lastNames = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Patel','Kim','Chen','Nguyen','Singh','Rivera','Clark','Walker','Hall'];
    var tiers = ['Bronze', 'Silver', 'Gold'];
    var cities = ['Austin', 'Denver', 'Chicago', 'New York', 'Miami', 'Los Angeles', 'Atlanta', 'Seattle'];
    var states = { 'Austin': 'TX', 'Denver': 'CO', 'Chicago': 'IL', 'New York': 'NY', 'Miami': 'FL', 'Los Angeles': 'CA', 'Atlanta': 'GA', 'Seattle': 'WA' };
    var rows = [];
    _seed = 42; // reset seed

    for (var i = 1; i <= 400; i++) {
      var fn = pick(firstNames);
      var ln = pick(lastNames);
      var city = pick(cities);
      var coords = cityCoords[city] || { lat: 0, lng: 0 };
      var hasEmail = rand() > 0.08;
      var hasPhone = rand() > 0.05;
      rows.push({
        customer_id: i,
        first_name: fn,
        last_name: ln,
        email: hasEmail ? (fn.toLowerCase() + '.' + ln.toLowerCase() + i + '@email.com') : null,
        phone: hasPhone ? ('555-' + String(randInt(100, 999)) + '-' + String(randInt(1000, 9999))) : 'N/A',
        city: city,
        state: states[city],
        latitude: +(coords.lat + (rand() - 0.5) * 0.1).toFixed(4),
        longitude: +(coords.lng + (rand() - 0.5) * 0.1).toFixed(4),
        membership_tier: pick(tiers),
        join_date: fmt(randomDate('2019-01-01', '2024-09-30')),
        date_of_birth: fmt(randomDate('1960-01-01', '2005-12-31'))
      });
    }
    return rows;
  })();

  // --- Transactions ---
  var transactionsData = (function () {
    var paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'Digital Wallet'];
    var rows = [];
    _seed = 100;

    for (var i = 1; i <= 3000; i++) {
      var txDate = randomDate('2023-01-01', '2024-12-31');
      var hasCustomer = rand() > 0.06; // ~6% anonymous (walk-in)
      var isFuture = rand() > 0.995; // ~0.5% have wrong future date
      if (isFuture) { txDate = randomDate('2025-06-01', '2025-12-31'); }

      rows.push({
        transaction_id: 'TXN-' + String(i).padStart(5, '0'),
        store_id: randInt(1, 10),
        customer_id: hasCustomer ? randInt(1, 400) : null,
        transaction_date: fmt(txDate),
        transaction_time: String(randInt(8, 21)).padStart(2, '0') + ':' + String(randInt(0, 59)).padStart(2, '0'),
        payment_method: pick(paymentMethods)
      });
    }
    // Add a couple of test transactions (data quality issue)
    rows.push({ transaction_id: 'TEST-00001', store_id: 1, customer_id: null, transaction_date: '2024-01-15', transaction_time: '10:00', payment_method: 'Cash' });
    rows.push({ transaction_id: 'TEST-00002', store_id: 2, customer_id: null, transaction_date: '2024-03-20', transaction_time: '14:30', payment_method: 'Cash' });

    return rows;
  })();

  // --- Transaction Items ---
  var transactionItemsData = (function () {
    var rows = [];
    var itemId = 1;
    _seed = 200;

    // Use only valid transaction IDs (exclude TEST ones)
    for (var t = 0; t < transactionsData.length; t++) {
      var tx = transactionsData[t];
      var numItems = randInt(1, 6);
      for (var j = 0; j < numItems; j++) {
        var prodId = randInt(1, 35);
        var prod = productsData.find(function(p) { return p.product_id === prodId; });
        var qty = randInt(1, 5);
        var isReturn = rand() > 0.97; // ~3% returns
        if (isReturn) qty = -qty;
        var disc = rand() > 0.7 ? Math.round(rand() * 20) : null; // 30% have null discount
        var unitPrice = prod ? prod.retail_price : 0; // some might get 0 if product not found
        if (rand() > 0.995) unitPrice = 0; // ~0.5% zero price (data issue)

        rows.push({
          item_id: itemId++,
          transaction_id: tx.transaction_id,
          product_id: prodId,
          quantity: qty,
          unit_price: unitPrice,
          discount_percent: disc
        });
      }
    }
    return rows;
  })();

  // ── Source Data Definitions ──
  var sourceData = {
    description: 'FreshMart uses a <strong>normalized OLTP database</strong> (Online Transaction Processing). Data is spread across 7 related tables. This is typical of operational systems — optimized for writes, not for analytics. Your job is to import this data into Power BI, clean it, and reshape it for analysis.',

    qualityIssues: [
      { table: 'categories', issue: 'Inconsistent casing — "dairy", "BEVERAGES", "Produce"', type: 'Formatting' },
      { table: 'subcategories', issue: 'Subcategory 15 has category_id=99 which does not exist (orphan record)', type: 'Referential Integrity' },
      { table: 'products', issue: 'Product "Bananas " has trailing whitespace. Product "Mystery Combo Pack" has NULL subcategory_id. Duplicate product name "Red Apples" (two different products).', type: 'Multiple' },
      { table: 'customers', issue: '~8% have NULL emails. Some phone numbers are "N/A" instead of NULL.', type: 'Missing Data' },
      { table: 'transactions', issue: '~6% have NULL customer_id (walk-in customers). ~0.5% have future dates (data entry error). Two TEST transactions exist.', type: 'Multiple' },
      { table: 'transaction_items', issue: '~3% have negative quantities (returns). ~30% have NULL discount_percent. ~0.5% have unit_price = 0.', type: 'Multiple' }
    ],

    tables: {
      categories: {
        description: 'Product categories (top-level grouping)',
        columns: [
          { name: 'category_id', type: 'INT', description: 'Primary Key' },
          { name: 'category_name', type: 'VARCHAR', description: 'Category name' }
        ],
        generateRows: function () { return categoriesData; }
      },
      subcategories: {
        description: 'Product subcategories (grouped under categories)',
        columns: [
          { name: 'subcategory_id', type: 'INT', description: 'Primary Key' },
          { name: 'subcategory_name', type: 'VARCHAR', description: 'Subcategory name' },
          { name: 'category_id', type: 'INT', description: 'FK to categories' }
        ],
        generateRows: function () { return subcategoriesData; }
      },
      products: {
        description: 'Product catalog with pricing',
        columns: [
          { name: 'product_id', type: 'INT', description: 'Primary Key' },
          { name: 'product_name', type: 'VARCHAR', description: 'Product display name' },
          { name: 'subcategory_id', type: 'INT', description: 'FK to subcategories (nullable)' },
          { name: 'brand', type: 'VARCHAR', description: 'Brand name' },
          { name: 'cost_price', type: 'DECIMAL', description: 'Cost to FreshMart' },
          { name: 'retail_price', type: 'DECIMAL', description: 'Selling price' }
        ],
        generateRows: function () { return productsData; }
      },
      stores: {
        description: 'Store locations with geographic coordinates',
        columns: [
          { name: 'store_id', type: 'INT', description: 'Primary Key' },
          { name: 'store_name', type: 'VARCHAR', description: 'Store display name' },
          { name: 'address', type: 'VARCHAR', description: 'Street address' },
          { name: 'city', type: 'VARCHAR', description: 'City' },
          { name: 'state', type: 'VARCHAR', description: 'State code' },
          { name: 'region', type: 'VARCHAR', description: 'Business region (South, West, Midwest, East)' },
          { name: 'manager_name', type: 'VARCHAR', description: 'Store manager' },
          { name: 'store_type', type: 'VARCHAR', description: 'Urban or Suburban' },
          { name: 'open_date', type: 'DATE', description: 'Store opening date' },
          { name: 'sqft', type: 'INT', description: 'Square footage' },
          { name: 'latitude', type: 'DECIMAL', description: 'GPS latitude' },
          { name: 'longitude', type: 'DECIMAL', description: 'GPS longitude' }
        ],
        generateRows: function () { return storesData; }
      },
      customers: {
        description: 'Customer records with membership info and location',
        columns: [
          { name: 'customer_id', type: 'INT', description: 'Primary Key' },
          { name: 'first_name', type: 'VARCHAR', description: 'First name' },
          { name: 'last_name', type: 'VARCHAR', description: 'Last name' },
          { name: 'email', type: 'VARCHAR', description: 'Email (nullable)' },
          { name: 'phone', type: 'VARCHAR', description: 'Phone number' },
          { name: 'city', type: 'VARCHAR', description: 'City' },
          { name: 'state', type: 'VARCHAR', description: 'State code' },
          { name: 'latitude', type: 'DECIMAL', description: 'Customer location latitude' },
          { name: 'longitude', type: 'DECIMAL', description: 'Customer location longitude' },
          { name: 'membership_tier', type: 'VARCHAR', description: 'Bronze, Silver, or Gold' },
          { name: 'join_date', type: 'DATE', description: 'Membership start date' },
          { name: 'date_of_birth', type: 'DATE', description: 'Date of birth' }
        ],
        generateRows: function () { return customersData; }
      },
      transactions: {
        description: 'Sales transaction headers',
        columns: [
          { name: 'transaction_id', type: 'VARCHAR', description: 'Primary Key (e.g. TXN-00001)' },
          { name: 'store_id', type: 'INT', description: 'FK to stores' },
          { name: 'customer_id', type: 'INT', description: 'FK to customers (nullable for walk-ins)' },
          { name: 'transaction_date', type: 'DATE', description: 'Date of purchase' },
          { name: 'transaction_time', type: 'VARCHAR', description: 'Time of purchase (HH:MM)' },
          { name: 'payment_method', type: 'VARCHAR', description: 'Cash, Credit Card, etc.' }
        ],
        generateRows: function () { return transactionsData; }
      },
      transaction_items: {
        description: 'Line items for each transaction (the most granular table)',
        columns: [
          { name: 'item_id', type: 'INT', description: 'Primary Key' },
          { name: 'transaction_id', type: 'VARCHAR', description: 'FK to transactions' },
          { name: 'product_id', type: 'INT', description: 'FK to products' },
          { name: 'quantity', type: 'INT', description: 'Qty purchased (negative = return)' },
          { name: 'unit_price', type: 'DECIMAL', description: 'Price at time of sale' },
          { name: 'discount_percent', type: 'DECIMAL', description: 'Discount % applied (nullable)' }
        ],
        generateRows: function () { return transactionItemsData; }
      },
      suppliers: {
        description: 'Supplier companies with geographic locations',
        columns: [
          { name: 'supplier_id', type: 'INT', description: 'Primary Key' },
          { name: 'supplier_name', type: 'VARCHAR', description: 'Company name' },
          { name: 'contact_name', type: 'VARCHAR', description: 'Primary contact' },
          { name: 'city', type: 'VARCHAR', description: 'City' },
          { name: 'state', type: 'VARCHAR', description: 'State code' },
          { name: 'country', type: 'VARCHAR', description: 'Country' },
          { name: 'latitude', type: 'DECIMAL', description: 'GPS latitude' },
          { name: 'longitude', type: 'DECIMAL', description: 'GPS longitude' },
          { name: 'phone', type: 'VARCHAR', description: 'Phone number' },
          { name: 'supplies', type: 'VARCHAR', description: 'Product categories supplied' }
        ],
        generateRows: function () { return suppliersData; }
      }
    }
  };

  // ══════════════════════════════════════════
  // DATA TRANSFORMATION STEPS
  // ══════════════════════════════════════════

  var transformationSteps = [
    {
      title: 'Profile Your Data',
      description: 'Before cleaning, examine the data quality using Power Query\'s built-in profiling tools.',
      instructions: [
        'In Power Query Editor, go to the <strong>View</strong> tab',
        'Enable <strong>Column Quality</strong> — shows % valid, error, empty per column',
        'Enable <strong>Column Distribution</strong> — shows distinct and unique counts',
        'Enable <strong>Column Profile</strong> — detailed stats for the selected column',
        'At the bottom-left, change profiling from "Top 1000 rows" to <strong>"Based on entire data set"</strong>'
      ],
      tip: 'Always profile on the entire data set! The default "Top 1000 rows" can miss issues in later rows.'
    },
    {
      title: 'Clean Categories Table',
      description: 'Fix inconsistent casing in category names.',
      instructions: [
        'Select the <strong>category_name</strong> column',
        'Right-click > <strong>Transform > Capitalize Each Word</strong> (or use Format > Capitalize Each Word)',
        'This converts "dairy" \u2192 "Dairy", "BEVERAGES" \u2192 "Beverages"'
      ],
      powerQueryCode: '= Table.TransformColumns(Source, {{"category_name", Text.Proper, type text}})',
      tip: 'Text.Proper capitalizes the first letter of each word — perfect for display names.'
    },
    {
      title: 'Clean Subcategories Table',
      description: 'Handle the orphan record (category_id = 99).',
      instructions: [
        'Merge subcategories with categories on category_id (Left Outer Join)',
        'Expand the merged column to get category_name',
        'Filter out rows where category_name is null (the orphan)',
        'Or: filter subcategories to remove rows where category_id is NOT IN the categories table'
      ],
      tip: 'Orphan records happen when data in one table references a non-existent record in another. Always validate foreign key relationships!'
    },
    {
      title: 'Clean Products Table',
      description: 'Fix whitespace, handle null subcategory, and address duplicate names.',
      instructions: [
        'Select all text columns > <strong>Transform > Trim</strong> (removes leading/trailing whitespace)',
        'This fixes "Bananas " \u2192 "Bananas"',
        'For the NULL subcategory_id: Replace null with a special value like -1, or create an "Unknown" subcategory',
        'For duplicate "Red Apples": Note that they are different products (different brands). Consider renaming to "Red Apples (FarmFresh)" and "Red Apples (OrchardGold)", or keep as-is since product_id is unique'
      ],
      tip: 'Trim should be applied to ALL text columns as a habit. Whitespace issues are invisible but break joins and filters.'
    },
    {
      title: 'Clean Customers Table',
      description: 'Handle NULL emails and "N/A" phone numbers.',
      instructions: [
        'For email column: NULL is acceptable — it means the customer didn\'t provide an email. Leave as-is.',
        'For phone column: Replace "N/A" with null for consistency',
        'Select phone column > Transform > Replace Values: Replace "N/A" with nothing (leave replacement empty)',
        'Create a <strong>Full Name</strong> column: Add Column > Custom Column > <code>[first_name] & " " & [last_name]</code>'
      ],
      powerQueryCode: '= Table.ReplaceValue(Source, "N/A", null, Replacer.ReplaceValue, {"phone"})',
      tip: 'Inconsistent representations of "missing" data (NULL vs "N/A" vs "" vs "None") are very common. Standardize to null.'
    },
    {
      title: 'Clean Transactions Table',
      description: 'Remove test data, fix future dates, handle anonymous customers.',
      instructions: [
        'Filter out TEST transactions: Filter transaction_id column > "does not begin with" > "TEST"',
        'Fix future dates: Filter transaction_date > "is on or before" > today\'s date. Or replace future dates with null.',
        'For NULL customer_id: Replace with 0 or a sentinel value, and add a matching "Walk-In Customer" record to the customers table'
      ],
      powerQueryCode: '= Table.SelectRows(Source, each not Text.StartsWith([transaction_id], "TEST"))',
      tip: 'Test/dummy data in production is common. Always check for it! Look for patterns like "TEST", "DEMO", "SAMPLE" in ID columns.'
    },
    {
      title: 'Clean Transaction Items',
      description: 'Handle null discounts, negative quantities, and zero prices.',
      instructions: [
        'Replace NULL discount_percent with <strong>0</strong> (no discount applied)',
        'Negative quantities are legitimate returns — keep them, but add a <strong>Is_Return</strong> column: <code>if [quantity] < 0 then true else false</code>',
        'Filter out or flag rows where unit_price = 0 (data error)',
        'Create <strong>Line_Total</strong> column: <code>[quantity] * [unit_price] * (1 - ([discount_percent] / 100))</code>'
      ],
      powerQueryCode: '= Table.ReplaceValue(Source, null, 0, Replacer.ReplaceValue, {"discount_percent"})',
      tip: 'Returns (negative quantities) are valid business transactions. Don\'t remove them — they affect your revenue calculations!'
    },
    {
      title: 'Create a Date Table',
      description: 'Generate a complete, contiguous Date table. This is CRITICAL for time intelligence in DAX.',
      instructions: [
        'Create a new blank query in Power Query',
        'Use the M code below to generate dates from 2023-01-01 to 2024-12-31',
        'Add columns: Year, Quarter, Month Number, Month Name, Day of Week, Day Name, Is Weekend, Fiscal Year, Fiscal Quarter',
        'After loading, go to Model view and <strong>Mark as Date Table</strong> using the Date column'
      ],
      powerQueryCode: 'let\n    StartDate = #date(2023, 1, 1),\n    EndDate = #date(2024, 12, 31),\n    DateList = List.Dates(StartDate, Duration.Days(EndDate - StartDate) + 1, #duration(1,0,0,0)),\n    ToTable = Table.FromList(DateList, Splitter.SplitByNothing(), {"Date"}, null, ExtraValues.Error),\n    ChangedType = Table.TransformColumnTypes(ToTable, {{"Date", type date}}),\n    AddYear = Table.AddColumn(ChangedType, "Year", each Date.Year([Date]), Int64.Type),\n    AddMonth = Table.AddColumn(AddYear, "MonthNum", each Date.Month([Date]), Int64.Type),\n    AddMonthName = Table.AddColumn(AddMonth, "MonthName", each Date.ToText([Date], "MMMM"), type text),\n    AddQuarter = Table.AddColumn(AddMonthName, "Quarter", each "Q" & Text.From(Date.QuarterOfYear([Date])), type text),\n    AddDayOfWeek = Table.AddColumn(AddQuarter, "DayOfWeek", each Date.DayOfWeek([Date], Day.Monday) + 1, Int64.Type),\n    AddDayName = Table.AddColumn(AddDayOfWeek, "DayName", each Date.ToText([Date], "dddd"), type text),\n    AddIsWeekend = Table.AddColumn(AddDayName, "IsWeekend", each Date.DayOfWeek([Date], Day.Monday) >= 5, type logical)\nin\n    AddIsWeekend',
      tip: 'ALWAYS create a proper Date table and mark it as a date table. Without it, DAX time intelligence functions (TOTALYTD, SAMEPERIODLASTYEAR, DATEADD) will NOT work!'
    }
  ];

  // ══════════════════════════════════════════
  // DATA MODEL (Star Schema)
  // ══════════════════════════════════════════

  var dataModel = {
    description: 'Transform the normalized OLTP data into a <strong>Star Schema</strong> — the gold standard for Power BI. A star schema has one central <strong>Fact table</strong> (containing measurable events/transactions) surrounded by <strong>Dimension tables</strong> (containing descriptive attributes).',

    whyStarSchema: [
      '<strong>Performance:</strong> Power BI\'s engine (VertiPaq) is optimized for star schemas — queries run faster.',
      '<strong>Simplicity:</strong> Users can understand a star schema intuitively — pick a measure from the fact, slice by any dimension.',
      '<strong>DAX Compatibility:</strong> Functions like RELATED, CALCULATE, and time intelligence work best with clean star schemas.',
      '<strong>Fewer Errors:</strong> Ambiguous relationships and circular dependencies are avoided.'
    ],

    facts: {
      name: 'Fact_Sales',
      description: 'One row per transaction line item. This is the grain — the most detailed level of data.',
      grain: 'One row per transaction line item (product purchased in a transaction)',
      columns: [
        { name: 'SalesKey', isKey: true },
        { name: 'DateKey', isKey: true },
        { name: 'ProductKey', isKey: true },
        { name: 'StoreKey', isKey: true },
        { name: 'CustomerKey', isKey: true },
        { name: 'TransactionID' },
        { name: 'Quantity' },
        { name: 'UnitPrice' },
        { name: 'DiscountPct' },
        { name: 'SalesAmount' },
        { name: 'IsReturn' }
      ],
      sourceMapping: 'JOIN transaction_items + transactions. SalesAmount = Quantity * UnitPrice * (1 - DiscountPct). DateKey = transaction_date.'
    },

    dimensions: {
      'Dim_Date': {
        description: 'Calendar dimension — one row per day.',
        columns: [
          { name: 'DateKey', isKey: true },
          { name: 'Date' },
          { name: 'Year' },
          { name: 'Quarter' },
          { name: 'MonthNum' },
          { name: 'MonthName' },
          { name: 'DayOfWeek' },
          { name: 'DayName' },
          { name: 'IsWeekend' }
        ],
        sourceMapping: 'Generated date table (see Transformation Step 8)'
      },
      'Dim_Product': {
        description: 'Product dimension — one row per product, flattened from products + subcategories + categories.',
        columns: [
          { name: 'ProductKey', isKey: true },
          { name: 'ProductName' },
          { name: 'Brand' },
          { name: 'SubcategoryName' },
          { name: 'CategoryName' },
          { name: 'CostPrice' },
          { name: 'RetailPrice' }
        ],
        sourceMapping: 'Merge products + subcategories + categories into a single flat table.'
      },
      'Dim_Store': {
        description: 'Store dimension — one row per store.',
        columns: [
          { name: 'StoreKey', isKey: true },
          { name: 'StoreName' },
          { name: 'City' },
          { name: 'State' },
          { name: 'Region' },
          { name: 'ManagerName' },
          { name: 'StoreType' }
        ],
        sourceMapping: 'Direct from stores table (rename store_id to StoreKey).'
      },
      'Dim_Customer': {
        description: 'Customer dimension — one row per customer.',
        columns: [
          { name: 'CustomerKey', isKey: true },
          { name: 'FullName' },
          { name: 'Email' },
          { name: 'City' },
          { name: 'State' },
          { name: 'MembershipTier' },
          { name: 'JoinDate' }
        ],
        sourceMapping: 'From customers table. Add a row for CustomerKey=0 "Walk-In Customer" for anonymous transactions.'
      }
    },

    relationships: [
      { from: 'Fact_Sales[DateKey]', to: 'Dim_Date[DateKey]', cardinality: 'Many to One', direction: 'Single' },
      { from: 'Fact_Sales[ProductKey]', to: 'Dim_Product[ProductKey]', cardinality: 'Many to One', direction: 'Single' },
      { from: 'Fact_Sales[StoreKey]', to: 'Dim_Store[StoreKey]', cardinality: 'Many to One', direction: 'Single' },
      { from: 'Fact_Sales[CustomerKey]', to: 'Dim_Customer[CustomerKey]', cardinality: 'Many to One', direction: 'Single' }
    ]
  };

  // ══════════════════════════════════════════
  // REPORTS
  // ══════════════════════════════════════════

  var reports = [
    {
      id: 'executive-overview',
      title: 'Executive Overview',
      difficulty: 'Easy',
      description: 'A high-level summary for the CEO and leadership team. Shows key KPIs, revenue trends, and top-level breakdowns. This should be the "landing page" of your report. Uses basic visuals: KPI cards, a line chart, a bar chart, and a donut chart.',
      audience: 'CEO, Regional Managers',
      visuals: [
        { type: 'KPI Card', title: 'Total Revenue', x: 15, y: 50, w: 120, h: 70 },
        { type: 'KPI Card', title: 'Gross Profit', x: 145, y: 50, w: 120, h: 70 },
        { type: 'KPI Card', title: 'Profit Margin %', x: 275, y: 50, w: 120, h: 70 },
        { type: 'KPI Card', title: 'Transactions', x: 405, y: 50, w: 120, h: 70 },
        { type: 'slicer', title: 'Year', x: 570, y: 50, w: 100, h: 70 },
        { type: 'slicer', title: 'Region', x: 680, y: 50, w: 100, h: 70 },
        { type: 'Line Chart', title: 'Monthly Revenue Trend', x: 15, y: 135, w: 380, h: 150 },
        { type: 'Bar Chart', title: 'Revenue by Store', x: 410, y: 135, w: 370, h: 150 },
        { type: 'Donut Chart', title: 'Revenue by Category', x: 15, y: 300, w: 240, h: 135 },
        { type: 'Table', title: 'Top 5 Products', x: 270, y: 300, w: 260, h: 135 },
        { type: 'KPI Card', title: 'YoY Growth %', x: 545, y: 300, w: 235, h: 135 }
      ]
    },
    {
      id: 'store-performance',
      title: 'Store Performance',
      difficulty: 'Medium',
      description: 'Compare stores side-by-side. Uses multi-series line charts, a performance matrix, and store-level KPIs. Requires cross-filtering between visuals and measures like Avg Basket Value.',
      audience: 'Regional Managers, Store Managers',
      visuals: [
        { type: 'slicer', title: 'Region', x: 15, y: 50, w: 130, h: 50 },
        { type: 'slicer', title: 'Year/Month', x: 155, y: 50, w: 200, h: 50 },
        { type: 'Clustered Bar', title: 'Revenue by Store', x: 15, y: 115, w: 380, h: 160 },
        { type: 'Matrix', title: 'Store Metrics Table', x: 410, y: 115, w: 370, h: 160 },
        { type: 'Line Chart', title: 'Monthly Trend by Store', x: 15, y: 290, w: 520, h: 145 },
        { type: 'KPI Card', title: 'Avg Basket Value', x: 550, y: 290, w: 115, h: 60 },
        { type: 'KPI Card', title: 'Best Store', x: 672, y: 290, w: 108, h: 60 }
      ]
    },
    {
      id: 'product-analysis',
      title: 'Product Analysis',
      difficulty: 'Hard',
      description: 'Advanced analysis using treemaps, scatter plots (Revenue vs Margin), and profitability tables. Requires calculated measures like Profit Margin % and Category % of Total. Uses drill-through and conditional formatting.',
      audience: 'Category Managers',
      visuals: [
        { type: 'slicer', title: 'Category', x: 15, y: 50, w: 150, h: 50 },
        { type: 'slicer', title: 'Brand', x: 175, y: 50, w: 150, h: 50 },
        { type: 'Treemap', title: 'Revenue by Category & Subcategory', x: 15, y: 115, w: 380, h: 160 },
        { type: 'Bar Chart', title: 'Top 10 Products by Revenue', x: 410, y: 115, w: 370, h: 160 },
        { type: 'Scatter Plot', title: 'Revenue vs Margin by Product', x: 15, y: 290, w: 380, h: 145 },
        { type: 'Table', title: 'Category Profitability', x: 410, y: 290, w: 370, h: 145 }
      ]
    },
    {
      id: 'customer-insights',
      title: 'Customer Insights',
      difficulty: 'Medium',
      description: 'Analyze customer segments by membership tier, track customer activity over time, and identify top spenders. Uses pie charts, segmented bar charts, and trend lines. Requires DISTINCTCOUNT and filtering measures.',
      audience: 'CEO, Marketing Team',
      visuals: [
        { type: 'slicer', title: 'Membership Tier', x: 15, y: 50, w: 160, h: 50 },
        { type: 'slicer', title: 'City', x: 185, y: 50, w: 130, h: 50 },
        { type: 'KPI Card', title: 'Customer Count', x: 370, y: 50, w: 130, h: 50 },
        { type: 'KPI Card', title: 'Revenue / Customer', x: 510, y: 50, w: 130, h: 50 },
        { type: 'Pie Chart', title: 'Revenue by Membership', x: 15, y: 115, w: 240, h: 160 },
        { type: 'Bar Chart', title: 'Customer Count by Tier', x: 270, y: 115, w: 250, h: 160 },
        { type: 'Line Chart', title: 'New Customers per Month', x: 535, y: 115, w: 245, h: 160 },
        { type: 'Table', title: 'Top 10 Customers by Spend', x: 15, y: 290, w: 765, h: 145 }
      ]
    },
    {
      id: 'geographic-analysis',
      title: 'Geographic Analysis',
      difficulty: 'Hard',
      description: 'Map-based report using store and customer geographic coordinates. Shows store locations as bubbles sized by revenue, customer distribution heat patterns, and regional comparisons. Requires the Map or Filled Map visual in Power BI and proper latitude/longitude data.',
      audience: 'CEO, Regional Managers, Expansion Planning',
      visuals: [
        { type: 'slicer', title: 'Year', x: 15, y: 50, w: 120, h: 50 },
        { type: 'slicer', title: 'Region', x: 145, y: 50, w: 140, h: 50 },
        { type: 'slicer', title: 'Category', x: 295, y: 50, w: 140, h: 50 },
        { type: 'KPI Card', title: 'Total Stores', x: 490, y: 50, w: 100, h: 50 },
        { type: 'KPI Card', title: 'Total Revenue', x: 600, y: 50, w: 100, h: 50 },
        { type: 'KPI Card', title: 'Avg Store Rev', x: 710, y: 50, w: 100, h: 50 },
        { type: 'Map', title: 'Store Locations (bubble = revenue)', x: 15, y: 115, w: 480, h: 200 },
        { type: 'Bar Chart', title: 'Revenue by Region', x: 510, y: 115, w: 270, h: 200 },
        { type: 'Map', title: 'Customer Distribution by City', x: 15, y: 330, w: 480, h: 110 },
        { type: 'Table', title: 'Store Performance by Geography', x: 510, y: 330, w: 270, h: 110 }
      ]
    }
  ];

  // ══════════════════════════════════════════
  // DAX MEASURES
  // ══════════════════════════════════════════

  var daxMeasures = [

    // ── CORE MEASURES ──

    {
      id: 'total-revenue',
      name: 'Total Revenue',
      formula: 'Total Revenue = SUM( Fact_Sales[SalesAmount] )',
      explanation: 'The most fundamental measure. Adds up the SalesAmount column from every row in the Fact_Sales table that is visible in the current filter context. When a slicer selects "2024", only 2024 rows contribute.',
      functionsUsed: ['SUM'],
      usedInReports: ['Executive Overview', 'Store Performance', 'Product Analysis'],
      whyMeasure: {
        reason: '<strong>A measure is essential here</strong> because we need this value to <strong>react to filter context</strong>. When a user selects "Store 1" in a slicer, Total Revenue must recalculate to show only Store 1\'s revenue. When they view a matrix with months on rows, each row must show that month\'s revenue. A measure recalculates dynamically every time the filter context changes.',
        canBeCalculatedColumn: false,
        alternative: '<strong>Could you just use "SUM of SalesAmount" from the field list?</strong> Yes! Power BI\'s implicit aggregation (dragging the SalesAmount field and selecting "Sum") does the same thing. However, creating an <strong>explicit measure</strong> is best practice because: (1) It has a clear name that business users understand, (2) Other measures can reference it via [Total Revenue], and (3) You control exactly how it behaves — implicit aggregations can surprise you in certain visual contexts.',
        alternativeCode: '// Implicit aggregation — just drag SalesAmount to a visual\n// Power BI auto-sums it. BUT you cannot reference\n// this in other DAX formulas.',
        whyMeasureBetter: 'Explicit measures are reusable building blocks. [Total Revenue] can be referenced by [Gross Profit], [Profit Margin %], [YoY Growth], etc. Implicit aggregation cannot be referenced in other formulas.',
        comparison: {
          measure: '<ul><li>Recalculates per filter context</li><li>Reusable in other measures</li><li>Clear, named business metric</li><li>Full control over behavior</li></ul>',
          altLabel: 'Implicit Aggregation',
          alt: '<ul><li>Also reacts to filters</li><li>Cannot be referenced by other DAX</li><li>No custom name (shows as "Sum of SalesAmount")</li><li>No control — Power BI picks aggregation</li></ul>'
        }
      }
    },
    {
      id: 'total-cost',
      name: 'Total Cost',
      formula: 'Total Cost =\n    SUMX(\n        Fact_Sales,\n        Fact_Sales[Quantity] * RELATED( Dim_Product[CostPrice] )\n    )',
      explanation: 'Calculates total cost of goods sold. For each row in Fact_Sales, it multiplies the quantity by the cost price (fetched from the Dim_Product table using RELATED). SUMX then sums all these row-level results.',
      functionsUsed: ['SUMX', 'RELATED'],
      usedInReports: ['Executive Overview', 'Product Analysis'],
      whyMeasure: {
        reason: '<strong>This is a case where you COULD use a calculated column instead</strong>, but a measure is the better choice. The calculation (Quantity * CostPrice) involves a cross-table lookup (RELATED), and you need the <strong>total</strong> to respond to filters. If you used a calculated column, you\'d store the per-row cost, then still need a measure to SUM it dynamically.',
        canBeCalculatedColumn: true,
        alternative: '<strong>Calculated Column approach:</strong> You could add a column called "CostAmount" in Power Query or as a calculated column, then SUM it in a measure. This pre-computes the row-level cost and stores it in the model.',
        alternativeCode: '// Step 1: Calculated Column on Fact_Sales\nCostAmount = Fact_Sales[Quantity] * RELATED( Dim_Product[CostPrice] )\n\n// Step 2: Measure to sum it\nTotal Cost = SUM( Fact_Sales[CostAmount] )',
        whyMeasureBetter: 'The single SUMX measure avoids creating an extra column in your data model. Extra columns increase file size and memory usage. For a column with 8,000 rows, the impact is small, but in real-world models with millions of rows, this matters. Use calculated columns only when you need to filter or sort by the value.',
        comparison: {
          measure: '<ul><li>No extra storage in model</li><li>One formula does everything</li><li>Responds to filters dynamically</li><li>Slightly slower (iterates at query time)</li></ul>',
          altLabel: 'Calculated Column + SUM',
          alt: '<ul><li>Pre-computed = faster queries</li><li>Can filter/sort by CostAmount</li><li>Adds a column to every row (storage cost)</li><li>Requires two steps instead of one</li></ul>'
        }
      }
    },
    {
      id: 'gross-profit',
      name: 'Gross Profit',
      formula: 'Gross Profit = [Total Revenue] - [Total Cost]',
      explanation: 'A simple calculated measure that subtracts Total Cost from Total Revenue. Notice how we reference other measures using square brackets — this is called <strong>measure composition</strong>. The beauty is that both [Total Revenue] and [Total Cost] automatically respect the current filter context.',
      functionsUsed: [],
      usedInReports: ['Executive Overview', 'Product Analysis'],
      whyMeasure: {
        reason: '<strong>Must be a measure.</strong> Gross Profit depends on two other measures — [Total Revenue] and [Total Cost]. Since both are measures that react to filter context, Gross Profit must also be a measure. You cannot create a calculated column that references a measure. This is <strong>measure composition</strong>: building complex calculations from simpler building blocks.',
        canBeCalculatedColumn: false,
        verdict: 'Measure Required \u2014 References Other Measures',
        comparison: {
          measure: '<ul><li>References [Total Revenue] and [Total Cost]</li><li>Both sub-measures react to slicers</li><li>Result is always consistent</li><li>Easy to understand and maintain</li></ul>',
          altLabel: 'Why Not a Column?',
          alt: '<ul><li>Calculated columns <strong>cannot reference measures</strong></li><li>You could compute row-level profit in Power Query (Revenue - Cost per row), but you\'d still need a measure to SUM it</li><li>Row-level profit wouldn\'t adapt to aggregation level</li></ul>'
        }
      }
    },
    {
      id: 'profit-margin',
      name: 'Profit Margin %',
      formula: 'Profit Margin % =\n    DIVIDE(\n        [Gross Profit],\n        [Total Revenue],\n        0\n    )',
      explanation: 'Calculates profit margin as a percentage. Uses DIVIDE instead of the "/" operator for safe division — if revenue is zero (e.g., a new store with no sales yet), it returns 0 instead of an error. <strong>Format this measure as Percentage in Power BI.</strong>',
      functionsUsed: ['DIVIDE'],
      usedInReports: ['Executive Overview', 'Product Analysis'],
      whyMeasure: {
        reason: '<strong>Must be a measure.</strong> Profit Margin is a <strong>ratio</strong> — it divides one aggregated total by another. Ratios are fundamentally different from row-level values. The margin for "Store 1" is different from "Store 2", and different from "All Stores". A ratio <strong>cannot be pre-computed at the row level</strong> because it depends on which rows are aggregated together.',
        canBeCalculatedColumn: false,
        verdict: 'Measure Required \u2014 Ratio of Aggregates',
        alternative: '<strong>Common mistake:</strong> Beginners sometimes try to add a "Margin" column to each row (row revenue / row cost), then average it. This gives a <strong>mathematically incorrect</strong> result! Averaging per-row margins is not the same as dividing total profit by total revenue.',
        alternativeCode: '// WRONG approach — do NOT do this:\nRow_Margin = (SalesAmount - CostAmount) / SalesAmount\n// Then using AVERAGE(Row_Margin) gives wrong results!\n// Example: Row 1 sells $1 item at 50% margin,\n// Row 2 sells $1000 item at 10% margin.\n// Average of margins = 30%, but true margin = 10.05%',
        whyMeasureBetter: 'The measure correctly divides TOTAL profit by TOTAL revenue. The incorrect column approach averages individual margins, giving equal weight to a $1 sale and a $1,000 sale. This is a classic "ratio of sums vs sum of ratios" mistake.'
      }
    },
    {
      id: 'total-transactions',
      name: 'Total Transactions',
      formula: 'Total Transactions = DISTINCTCOUNT( Fact_Sales[TransactionID] )',
      explanation: 'Counts the number of unique transactions. Since Fact_Sales has multiple rows per transaction (one per product), we use DISTINCTCOUNT to count each TransactionID only once.',
      functionsUsed: ['DISTINCTCOUNT'],
      usedInReports: ['Executive Overview', 'Store Performance'],
      whyMeasure: {
        reason: '<strong>Must be a measure.</strong> DISTINCTCOUNT is an aggregation — it looks across multiple rows to find unique values. A calculated column operates on one row at a time and cannot "look at" other rows. When you filter to January 2024, this measure must count distinct transactions only for that month. That context-awareness is only possible with a measure.',
        canBeCalculatedColumn: false,
        verdict: 'Measure Required \u2014 Cross-Row Aggregation',
        comparison: {
          measure: '<ul><li>Counts unique TransactionIDs dynamically</li><li>Reacts to date, store, product slicers</li><li>Result changes per visual context</li></ul>',
          altLabel: 'Why Not a Column?',
          alt: '<ul><li>A column is one value per row</li><li>You could flag "first row of each transaction" but still need a measure to count flags</li><li>There is no column-level concept of "distinct across rows"</li></ul>'
        }
      }
    },
    {
      id: 'avg-basket-value',
      name: 'Average Basket Value',
      formula: 'Avg Basket Value =\n    DIVIDE(\n        [Total Revenue],\n        [Total Transactions],\n        0\n    )',
      explanation: 'How much does the average customer spend per visit? Divides total revenue by the number of unique transactions. This KPI helps understand purchasing behavior — a rising basket value means customers are buying more per trip.',
      functionsUsed: ['DIVIDE'],
      usedInReports: ['Executive Overview', 'Store Performance'],
      whyMeasure: {
        reason: '<strong>Must be a measure.</strong> Like Profit Margin, this is a <strong>ratio of two aggregated values</strong>. The basket value for "Gold members" is different from "Bronze members" — it must recalculate based on the current filter context. Both the numerator ([Total Revenue]) and denominator ([Total Transactions]) are themselves measures.',
        canBeCalculatedColumn: false,
        verdict: 'Measure Required \u2014 Ratio of Measures'
      }
    },
    {
      id: 'customer-count',
      name: 'Customer Count',
      formula: 'Customer Count = DISTINCTCOUNT( Fact_Sales[CustomerKey] )',
      explanation: 'Counts unique customers who made at least one purchase in the current filter context. If you filter to January 2024, this shows how many distinct customers bought something that month.',
      functionsUsed: ['DISTINCTCOUNT'],
      usedInReports: ['Customer Insights'],
      whyMeasure: {
        reason: '<strong>Must be a measure.</strong> The count of unique customers changes depending on what you\'re looking at. In January, 85 customers might have shopped; in February, 92. At Store 1, 120 unique customers over the year. These are all the same measure evaluated in different filter contexts. This kind of dynamic counting is impossible with a static column value.',
        canBeCalculatedColumn: false,
        verdict: 'Measure Required \u2014 Context-Dependent Aggregation'
      }
    },
    {
      id: 'revenue-per-customer',
      name: 'Revenue Per Customer',
      formula: 'Revenue Per Customer =\n    DIVIDE(\n        [Total Revenue],\n        [Customer Count],\n        0\n    )',
      explanation: 'Average revenue generated per customer. Helps identify the value of each customer relationship. Higher values suggest loyal, high-spending customers.',
      functionsUsed: ['DIVIDE', 'DISTINCTCOUNT'],
      usedInReports: ['Customer Insights'],
      whyMeasure: {
        reason: '<strong>Must be a measure.</strong> Revenue Per Customer is a ratio of two context-sensitive aggregations. For "Gold" members, it divides Gold revenue by Gold customer count. For "Store 1", it divides Store 1 revenue by Store 1 customer count. This dynamic recalculation per context is what measures do.',
        canBeCalculatedColumn: false,
        verdict: 'Measure Required \u2014 Ratio of Measures'
      }
    },

    // ── RANKING & COMPARISON MEASURES ──

    {
      id: 'store-pct-of-total',
      name: 'Store % of Total Revenue',
      formula: 'Store % of Total =\n    DIVIDE(\n        [Total Revenue],\n        CALCULATE( [Total Revenue], ALL( Dim_Store ) ),\n        0\n    )',
      explanation: 'Shows what percentage each store contributes to the overall total. The numerator is the store\'s revenue (filtered by the current row/slicer). The denominator uses ALL(Dim_Store) inside CALCULATE to remove all store filters, giving the grand total. The result is a dynamic percentage.',
      functionsUsed: ['DIVIDE', 'CALCULATE', 'ALL'],
      usedInReports: ['Store Performance'],
      whyMeasure: {
        reason: '<strong>Must be a measure — this is impossible without one.</strong> The "% of Total" pattern requires two different filter contexts in the same calculation: (1) the current store\'s revenue, and (2) ALL stores\' revenue. Only CALCULATE can modify the filter context mid-calculation. There is no column, visual setting, or Power Query step that can do this.',
        canBeCalculatedColumn: false,
        verdict: 'Measure Required \u2014 Filter Context Manipulation',
        alternative: '<strong>Visual-level workaround:</strong> Some visuals (like Bar Chart) have a "Show value as > % of grand total" option in the formatting pane. However, this only works in that specific visual and cannot be reused in other visuals, cards, or calculations. It\'s also not available in Tables or Matrices.',
        canBeVisualLevel: true,
        whyMeasureBetter: 'A measure works in ANY visual — cards, tables, matrices, charts — and can be referenced by other measures. The visual-level option is limited to specific chart types and can\'t be composed into more complex calculations.',
        comparison: {
          measure: '<ul><li>Works in any visual type</li><li>Can be referenced by other measures</li><li>Full control over the denominator (ALL vs ALLSELECTED)</li><li>Can be conditionally formatted</li></ul>',
          altLabel: 'Visual % of Total',
          alt: '<ul><li>Quick — no DAX needed</li><li>Only works in certain chart types</li><li>Cannot be used in cards or tables</li><li>Cannot be referenced by other measures</li><li>Lost if you change visual type</li></ul>'
        }
      }
    },
    {
      id: 'category-pct',
      name: 'Category % of Total Revenue',
      formula: 'Category % of Total =\n    DIVIDE(\n        [Total Revenue],\n        CALCULATE(\n            [Total Revenue],\n            ALL( Dim_Product[CategoryName] )\n        ),\n        0\n    )',
      explanation: 'Shows each product category\'s share of total revenue. Uses ALL on just the CategoryName column — so if a user has a Year slicer set to 2024, the denominator is still filtered by 2024, just with category filters removed. This gives "percentage within the current time period" rather than "percentage of all-time total".',
      functionsUsed: ['DIVIDE', 'CALCULATE', 'ALL'],
      usedInReports: ['Product Analysis'],
      whyMeasure: {
        reason: '<strong>Must be a measure.</strong> Same pattern as Store % of Total, but notice a subtle difference: we use <code>ALL(Dim_Product[CategoryName])</code> instead of <code>ALL(Dim_Product)</code>. This removes only the category filter while keeping other filters (Year, Store) active. This level of filter control is only possible through DAX measures with CALCULATE.',
        canBeCalculatedColumn: false,
        verdict: 'Measure Required \u2014 Selective Filter Removal'
      }
    },
    {
      id: 'product-rank',
      name: 'Product Revenue Rank',
      formula: 'Product Rank =\n    IF(\n        HASONEVALUE( Dim_Product[ProductName] ),\n        RANKX(\n            ALL( Dim_Product[ProductName] ),\n            [Total Revenue],\n            ,\n            0,\n            "Dense"\n        )\n    )',
      explanation: 'Ranks each product by revenue, with rank 1 being the highest revenue product. Uses RANKX to compare each product\'s revenue against all products. The IF + HASONEVALUE wrapper ensures the rank only shows when a single product is in context (i.e., on a row), not at subtotal level. Dense ranking means no gaps (1, 2, 2, 3 instead of 1, 2, 2, 4).',
      functionsUsed: ['IF', 'RANKX', 'ALL'],
      usedInReports: ['Product Analysis'],
      whyMeasure: {
        reason: '<strong>Must be a measure.</strong> Ranking is inherently a cross-row comparison — "how does THIS product compare to ALL products?" A calculated column could compute a static rank, but it would never change when a user filters by store or time period. The measure recalculates the ranking dynamically — Top products at Store 1 may be completely different from Store 2.',
        canBeCalculatedColumn: true,
        alternative: '<strong>Calculated column approach:</strong> You can create a calculated column with RANKX. It will rank products based on their all-time, all-stores total revenue. But this rank is frozen — it won\'t change when users interact with slicers.',
        alternativeCode: '// Calculated Column (static rank — never changes)\nStatic Rank =\n    RANKX( ALL( Dim_Product ), [Total Revenue], , 0, "Dense" )',
        whyMeasureBetter: 'The measure-based rank updates dynamically. Filter to Q1 and the rank shows Q1 performance. Filter to Store 3 and the rank shows Store 3\'s top products. The column-based rank always shows the same all-time ranking regardless of context.',
        comparison: {
          measure: '<ul><li>Rank recalculates per filter context</li><li>"Top product in Q1" vs "Top product in Q2"</li><li>Useful for interactive exploration</li></ul>',
          altLabel: 'Calculated Column Rank',
          alt: '<ul><li>Rank is fixed at refresh time</li><li>Always shows all-time ranking</li><li>Useful if you want a permanent sorting column</li><li>Cannot adapt to slicers</li></ul>'
        }
      }
    },
    {
      id: 'return-rate',
      name: 'Return Rate %',
      formula: 'Return Rate % =\n    VAR TotalItems =\n        COUNTROWS( Fact_Sales )\n    VAR ReturnItems =\n        COUNTROWS(\n            FILTER( Fact_Sales, Fact_Sales[IsReturn] = TRUE )\n        )\n    RETURN\n        DIVIDE( ReturnItems, TotalItems, 0 )',
      explanation: 'Calculates the percentage of line items that are returns. Uses VAR to store intermediate calculations for readability. FILTER creates a subset of only return rows, COUNTROWS counts them, then DIVIDE calculates the percentage. This tells you how often customers are returning products.',
      functionsUsed: ['COUNTROWS', 'FILTER', 'DIVIDE'],
      usedInReports: ['Product Analysis', 'Store Performance'],
      whyMeasure: {
        reason: '<strong>Must be a measure.</strong> Return Rate is a ratio that depends on filter context. Store 1 might have a 2% return rate while Store 3 has 5%. Product "Croissants" might have 8% returns while "Coffee" has 0.5%. Both the numerator (return count) and denominator (total count) must be filtered by the current context, and their ratio computed dynamically.',
        canBeCalculatedColumn: false,
        verdict: 'Measure Required \u2014 Filtered Ratio'
      }
    },

    // ── TIME INTELLIGENCE MEASURES ──

    {
      id: 'revenue-prev-month',
      name: 'Revenue Previous Month',
      formula: 'Revenue Previous Month =\n    CALCULATE(\n        [Total Revenue],\n        DATEADD( Dim_Date[Date], -1, MONTH )\n    )',
      explanation: 'Shifts the date filter back by one month and calculates revenue for that period. CALCULATE modifies the filter context — it takes the current month\'s dates and shifts them all back by one month using DATEADD. <strong>Requires a proper Date table marked as a date table.</strong>',
      functionsUsed: ['CALCULATE', 'DATEADD'],
      usedInReports: ['Executive Overview'],
      whyMeasure: {
        reason: '<strong>Must be a measure — impossible without one.</strong> Time intelligence requires dynamically shifting the date filter. When viewing March, the measure must "look back" to February. When viewing October, it must look at September. This dynamic context shifting can only be done by CALCULATE + DATEADD inside a measure. No column, Power Query step, or visual setting can achieve this.',
        canBeCalculatedColumn: false,
        verdict: 'Measure Required \u2014 Time Intelligence',
        alternative: '<strong>Could you add "last month\'s revenue" as a column in Power Query?</strong> Technically, you could create a lookup that finds the previous month\'s total for each row\'s month. But this is (1) extremely complex in Power Query, (2) doesn\'t respond to other filters (store, category), and (3) breaks the star schema pattern. This is exactly what DAX measures are designed for.',
        whyMeasureBetter: 'DAX time intelligence functions like DATEADD are purpose-built for this. They handle month boundaries, year boundaries, leap years, and different month lengths automatically. They also respect all other active filters (store, product, customer).'
      }
    },
    {
      id: 'mom-growth',
      name: 'MoM Growth %',
      formula: 'MoM Growth % =\n    VAR CurrentMonth = [Total Revenue]\n    VAR PreviousMonth = [Revenue Previous Month]\n    RETURN\n        DIVIDE(\n            CurrentMonth - PreviousMonth,\n            PreviousMonth,\n            0\n        )',
      explanation: 'Month-over-month growth percentage. Uses VAR (variables) to store intermediate results for readability. First captures current month revenue, then previous month revenue, then calculates the percentage change. VAR makes complex measures much easier to read and debug.',
      functionsUsed: ['DIVIDE', 'CALCULATE', 'DATEADD'],
      usedInReports: ['Executive Overview'],
      whyMeasure: {
        reason: '<strong>Must be a measure.</strong> Growth % combines two time-shifted values (current and previous period) into a ratio. Both values are themselves measures that depend on the date context. There\'s a chain: MoM Growth → calls [Revenue Previous Month] → calls CALCULATE + DATEADD → calls [Total Revenue]. This chain of context-dependent calculations can only exist as measures.',
        canBeCalculatedColumn: false,
        verdict: 'Measure Required \u2014 Chained Time Intelligence'
      }
    },
    {
      id: 'ytd-revenue',
      name: 'YTD Revenue',
      formula: 'YTD Revenue = TOTALYTD( [Total Revenue], Dim_Date[Date] )',
      explanation: 'Year-to-date revenue — accumulates from January 1 to the current date in context. If viewing March, it shows Jan + Feb + Mar combined. Resets at the beginning of each year. This is a time intelligence function that requires a date table.',
      functionsUsed: ['TOTALYTD'],
      usedInReports: ['Executive Overview'],
      whyMeasure: {
        reason: '<strong>Must be a measure.</strong> YTD is a running accumulation that depends on which date the user is looking at. In a monthly line chart, the January point shows January only, February shows Jan+Feb, March shows Jan+Feb+Mar. The accumulation window changes per data point. Only a measure with TOTALYTD can do this dynamic accumulation.',
        canBeCalculatedColumn: false,
        verdict: 'Measure Required \u2014 Dynamic Accumulation',
        canBeVisualLevel: true,
        alternative: '<strong>Visual-level option:</strong> In a line/bar chart, you can use the Analytics pane or visual\'s "Running total" option. However, (1) TOTALYTD resets each year automatically, while a visual running total doesn\'t, and (2) the visual option can\'t be used in cards, tables, or referenced by other measures.',
        whyMeasureBetter: 'TOTALYTD handles year boundaries automatically, works in any visual type, and can be referenced by other measures (e.g., comparing YTD this year vs YTD last year).'
      }
    },
    {
      id: 'yoy-growth',
      name: 'YoY Growth %',
      formula: 'YoY Growth % =\n    VAR CurrentPeriod = [Total Revenue]\n    VAR SamePeriodLastYear =\n        CALCULATE(\n            [Total Revenue],\n            SAMEPERIODLASTYEAR( Dim_Date[Date] )\n        )\n    RETURN\n        DIVIDE(\n            CurrentPeriod - SamePeriodLastYear,\n            SamePeriodLastYear,\n            0\n        )',
      explanation: 'Year-over-year growth. Compares current period revenue to the exact same period one year ago. Uses SAMEPERIODLASTYEAR to shift dates back by exactly one year. If viewing March 2024, it compares to March 2023. Essential for seasonal businesses where MoM comparisons can be misleading.',
      functionsUsed: ['CALCULATE', 'SAMEPERIODLASTYEAR', 'DIVIDE'],
      usedInReports: ['Executive Overview'],
      whyMeasure: {
        reason: '<strong>Must be a measure — this is the defining use case for DAX.</strong> YoY Growth compares the same measure across two time periods that are exactly one year apart, and calculates the difference as a percentage. The "same period" shifts dynamically — if you look at March 2024, it compares to March 2023. If you look at Q2 2024, it compares to Q2 2023. This contextual time-shifting is uniquely what DAX measures can do.',
        canBeCalculatedColumn: false,
        verdict: 'Measure Required \u2014 Cross-Period Comparison'
      }
    },
    {
      id: 'qtd-revenue',
      name: 'QTD Revenue',
      formula: 'QTD Revenue = TOTALQTD( [Total Revenue], Dim_Date[Date] )',
      explanation: 'Quarter-to-date revenue — accumulates from the start of the current quarter to the current date in context. If viewing February (Q1), it shows Jan + Feb. Resets at the start of each quarter.',
      functionsUsed: ['TOTALYTD'],
      usedInReports: ['Executive Overview'],
      whyMeasure: {
        reason: '<strong>Must be a measure.</strong> Same reasoning as YTD Revenue — the accumulation window depends on the current date context and resets at quarter boundaries. Only a time intelligence measure can handle this dynamic behavior.',
        canBeCalculatedColumn: false,
        verdict: 'Measure Required \u2014 Dynamic Accumulation'
      }
    },

    // ── CONDITIONAL & SEGMENTATION MEASURES ──

    {
      id: 'weekend-revenue',
      name: 'Weekend Revenue',
      formula: 'Weekend Revenue =\n    CALCULATE(\n        [Total Revenue],\n        Dim_Date[IsWeekend] = TRUE\n    )',
      explanation: 'Revenue generated on weekends only (Saturday and Sunday). Uses CALCULATE to add a filter on the IsWeekend column. Even if the user hasn\'t filtered by day type, this measure always restricts to weekends.',
      functionsUsed: ['CALCULATE'],
      usedInReports: ['Executive Overview', 'Store Performance'],
      whyMeasure: {
        reason: '<strong>Must be a measure if you want it dynamic.</strong> While you could filter your visual to weekends only, a measure lets you show Weekend Revenue alongside Total Revenue in the same table row. For example, a table with stores showing Total Revenue, Weekend Revenue, and Weekday Revenue side-by-side — only measures allow these multiple "views" of the same data simultaneously.',
        canBeCalculatedColumn: false,
        canBeVisualLevel: true,
        verdict: 'Measure Preferred \u2014 Parallel Comparisons',
        alternative: '<strong>Visual filter approach:</strong> You could add a filter on the visual to show only rows where IsWeekend = TRUE. But then your ENTIRE visual is limited to weekends — you can\'t show weekday and weekend revenue side-by-side.',
        whyMeasureBetter: 'Measures let you create parallel calculations — Weekend Revenue and Weekday Revenue in the same row/visual. Visual filters can only restrict the whole visual to one condition.',
        comparison: {
          measure: '<ul><li>Show weekend and weekday side-by-side</li><li>Calculate weekend % of total</li><li>Use in cards alongside total revenue</li><li>Reference in other measures</li></ul>',
          altLabel: 'Visual-Level Filter',
          alt: '<ul><li>Quick — just add a filter to the visual</li><li>Entire visual restricted to weekends</li><li>Cannot show weekend vs weekday in same visual</li><li>Cannot calculate weekend %</li></ul>'
        }
      }
    },
    {
      id: 'gold-member-revenue',
      name: 'Gold Member Revenue',
      formula: 'Gold Member Revenue =\n    CALCULATE(\n        [Total Revenue],\n        Dim_Customer[MembershipTier] = "Gold"\n    )',
      explanation: 'Revenue from Gold tier members only. Useful for understanding how much your premium customers contribute, regardless of other filters applied. Uses CALCULATE to override or add a membership filter.',
      functionsUsed: ['CALCULATE'],
      usedInReports: ['Customer Insights'],
      whyMeasure: {
        reason: '<strong>A measure is needed to isolate segment revenue while keeping other filters active.</strong> This measure always shows Gold revenue, even if a store or date slicer is active. If you\'re comparing January vs February, you see Gold revenue for each month. If you need it side-by-side with Silver and Bronze, only measures can do that.',
        canBeCalculatedColumn: false,
        canBeVisualLevel: true,
        verdict: 'Measure Preferred \u2014 Segment Isolation',
        alternative: '<strong>Slicer approach:</strong> The user could simply select "Gold" in a Membership Tier slicer, and all visuals would filter to Gold members. This works for exploration but doesn\'t allow comparing tiers side-by-side in one visual.',
        whyMeasureBetter: 'A measure lets you build a matrix: Rows = Stores, Columns = Gold Revenue | Silver Revenue | Bronze Revenue. A slicer can only show one tier at a time.'
      }
    },
    {
      id: 'high-value-txn-count',
      name: 'High-Value Transaction Count',
      formula: 'High-Value Transactions =\n    CALCULATE(\n        [Total Transactions],\n        FILTER(\n            Fact_Sales,\n            Fact_Sales[SalesAmount] > 20\n        )\n    )',
      explanation: 'Counts transactions that contain at least one line item over $20. Uses FILTER inside CALCULATE to restrict Fact_Sales to high-value rows, then counts distinct transactions among those rows. Helps identify premium purchasing behavior.',
      functionsUsed: ['CALCULATE', 'FILTER', 'DISTINCTCOUNT'],
      usedInReports: ['Customer Insights', 'Store Performance'],
      whyMeasure: {
        reason: '<strong>Must be a measure.</strong> This uses FILTER inside CALCULATE to apply a row-level condition (SalesAmount > 20) that can\'t be expressed as a simple slicer. The threshold could even be parameterized with a What-If parameter. The filtered count must also respond to other slicers (date, store, customer tier).',
        canBeCalculatedColumn: false,
        verdict: 'Measure Required \u2014 Parameterized Filter'
      }
    },
    {
      id: 'avg-revenue-per-store',
      name: 'Average Revenue Per Store',
      formula: 'Avg Revenue Per Store =\n    AVERAGEX(\n        VALUES( Dim_Store[StoreName] ),\n        [Total Revenue]\n    )',
      explanation: 'Calculates the average revenue across all stores. AVERAGEX iterates over each unique store (using VALUES to get the list), evaluates [Total Revenue] for each store, then averages the results. Different from total revenue / store count because it handles stores with zero sales correctly.',
      functionsUsed: ['AVERAGEX', 'VALUES'],
      usedInReports: ['Executive Overview', 'Store Performance'],
      whyMeasure: {
        reason: '<strong>Must be a measure — demonstrates a key DAX pattern.</strong> This calculates "average of a measure across a dimension" — you need to iterate over stores and evaluate [Total Revenue] for each one. This is the AVERAGEX + VALUES pattern, which is impossible without measures. A column can only compute per-row, never "per-group average" dynamically.',
        canBeCalculatedColumn: false,
        verdict: 'Measure Required \u2014 Iterator Over Dimension',
        comparison: {
          measure: '<ul><li>Averages revenue per store dynamically</li><li>If Year=2024 selected, averages only 2024 revenue per store</li><li>Correctly handles stores with $0 revenue</li></ul>',
          altLabel: 'Why Not DIVIDE?',
          alt: '<ul><li>DIVIDE([Total Revenue], COUNTROWS(Dim_Store)) is simpler</li><li>But it always divides by ALL stores, even those with $0</li><li>AVERAGEX only averages over stores that have sales in context</li><li>For this dataset, both give similar results — AVERAGEX matters when some stores have no data in the filtered period</li></ul>'
        }
      }
    },
    {
      id: 'new-customers',
      name: 'New Customers This Month',
      formula: 'New Customers =\n    VAR CurrentCustomers =\n        VALUES( Fact_Sales[CustomerKey] )\n    VAR PriorCustomers =\n        CALCULATETABLE(\n            VALUES( Fact_Sales[CustomerKey] ),\n            DATEADD( Dim_Date[Date], -1, MONTH )\n        )\n    RETURN\n        COUNTROWS(\n            EXCEPT( CurrentCustomers, PriorCustomers )\n        )',
      explanation: 'Counts customers who purchased in the current month but NOT in the previous month. Uses EXCEPT to find customers in the current set that are not in the prior month set. This identifies first-time or returning-after-absence customers.',
      functionsUsed: ['VALUES', 'CALCULATE', 'DATEADD', 'COUNTROWS'],
      usedInReports: ['Customer Insights'],
      whyMeasure: {
        reason: '<strong>Must be a measure — complex cross-period comparison.</strong> This compares two sets of customers across two time periods and counts the difference. It requires: (1) getting current period customers, (2) shifting the date context to get previous period customers, (3) finding the difference with EXCEPT, and (4) counting the result. Every step is context-dependent and uses functions that only work in measures.',
        canBeCalculatedColumn: false,
        verdict: 'Measure Required \u2014 Set Comparison Across Time'
      }
    }
  ];

  // ══════════════════════════════════════════
  // PRACTICE PROBLEMS
  // ══════════════════════════════════════════

  var practiceProblems = [
    {
      id: 1,
      difficulty: 'Easy',
      title: 'Total Quantity Sold',
      prompt: 'Write a DAX measure that calculates the total quantity of items sold across all transactions. Remember that some quantities are negative (returns) — should they be included or excluded?',
      hints: [
        'Think about which column in Fact_Sales contains the quantity.',
        'SUM is the simplest aggregation function for adding up a column.',
        'Consider: returns (negative values) will reduce the total. This might be the desired behavior (net quantity).'
      ],
      solution: {
        formula: 'Total Quantity = SUM( Fact_Sales[Quantity] )',
        explanation: 'SUM adds all values in the Quantity column, including negative values (returns). This gives you the <strong>net quantity sold</strong>. If you wanted gross quantity (ignoring returns), you would filter out negative values using CALCULATE + FILTER.'
      }
    },
    {
      id: 2,
      difficulty: 'Easy',
      title: 'Unique Products Sold',
      prompt: 'Write a DAX measure that counts how many different products were sold (not the total quantity, but the number of distinct products that appear in transactions).',
      hints: [
        'You need to count unique product IDs, not rows.',
        'DISTINCTCOUNT counts unique values in a column.'
      ],
      solution: {
        formula: 'Products Sold = DISTINCTCOUNT( Fact_Sales[ProductKey] )',
        explanation: 'DISTINCTCOUNT counts each unique ProductKey only once, regardless of how many times it was sold. This tells you the breadth of products that customers are buying.'
      }
    },
    {
      id: 3,
      difficulty: 'Medium',
      title: 'Average Discount Applied',
      prompt: 'Write a DAX measure that calculates the average discount percentage across all line items. But only include items that actually had a discount (discount > 0). Items with no discount should not bring the average down.',
      hints: [
        'AVERAGEX iterates over a table and averages an expression.',
        'You need to filter the Fact_Sales table to only include rows where DiscountPct > 0.',
        'FILTER( table, condition ) returns a filtered table.'
      ],
      solution: {
        formula: 'Avg Discount % =\n    AVERAGEX(\n        FILTER( Fact_Sales, Fact_Sales[DiscountPct] > 0 ),\n        Fact_Sales[DiscountPct]\n    )',
        explanation: 'FILTER creates a subset of Fact_Sales containing only rows where DiscountPct > 0. AVERAGEX then iterates over this filtered table and averages the DiscountPct values. This gives a true average of discounts when discounts were applied.'
      }
    },
    {
      id: 4,
      difficulty: 'Medium',
      title: 'Revenue for Produce Category Only',
      prompt: 'Write a DAX measure that calculates total revenue but only for the "Produce" product category. This measure should always show Produce revenue regardless of what category a user selects in a slicer.',
      hints: [
        'CALCULATE changes the filter context of a measure.',
        'You need to add a filter condition for the CategoryName column in Dim_Product.',
        'The filter inside CALCULATE overrides any existing filter on that column.'
      ],
      solution: {
        formula: 'Produce Revenue =\n    CALCULATE(\n        [Total Revenue],\n        Dim_Product[CategoryName] = "Produce"\n    )',
        explanation: 'CALCULATE evaluates [Total Revenue] but overrides the filter on CategoryName to only include "Produce". Even if a user selects "Bakery" in a slicer, this measure still shows Produce revenue because the CALCULATE filter takes precedence.'
      }
    },
    {
      id: 5,
      difficulty: 'Hard',
      title: 'Running Total by Month',
      prompt: 'Write a DAX measure that shows a running (cumulative) total of revenue by month. For example, if Jan = $10K and Feb = $8K, Feb should show $18K. This should reset each year.',
      hints: [
        'You need to calculate revenue for all dates from the start of the year up to the current month.',
        'CALCULATE with FILTER and ALLSELECTED/ALL on the date table can achieve this.',
        'Think about using TOTALYTD — it naturally does year-to-date accumulation.',
        'Alternatively, use CALCULATE + FILTER + ALL on the date, checking dates <= MAX current date.'
      ],
      solution: {
        formula: 'Running Total =\n    CALCULATE(\n        [Total Revenue],\n        FILTER(\n            ALLSELECTED( Dim_Date[Date] ),\n            Dim_Date[Date] <= MAX( Dim_Date[Date] )\n        )\n    )',
        explanation: 'This measure works by expanding the date filter. ALLSELECTED(Dim_Date[Date]) gets all dates visible in the current slicer context. FILTER keeps only dates up to the MAX date in the current row. So for February, it includes January AND February dates. The result is a cumulative total. <strong>Simpler alternative:</strong> <code>Running Total = TOTALYTD([Total Revenue], Dim_Date[Date])</code> — this does the same thing automatically with year-to-date accumulation!'
      }
    },
    {
      id: 6,
      difficulty: 'Hard',
      title: 'Store Percentage of Total Revenue',
      prompt: 'Write a DAX measure that shows what percentage each store contributes to the total revenue. If Downtown has $25K revenue out of $100K total, it should show 25%. The denominator (total) should NOT change when a user selects a specific store.',
      hints: [
        'The numerator is just [Total Revenue] — it respects the current store filter.',
        'The denominator needs to be [Total Revenue] ignoring all store filters.',
        'ALL( Dim_Store ) removes all filters on the store dimension.',
        'Combine these with DIVIDE for safe division.'
      ],
      solution: {
        formula: 'Store % of Total =\n    DIVIDE(\n        [Total Revenue],\n        CALCULATE( [Total Revenue], ALL( Dim_Store ) ),\n        0\n    )',
        explanation: 'The numerator [Total Revenue] respects the current filter context — so if we\'re looking at the Downtown store row, it shows Downtown\'s revenue. The denominator uses CALCULATE with ALL(Dim_Store) to remove any store-level filters, giving the grand total. DIVIDE then calculates the percentage safely. <strong>Format this as Percentage in Power BI.</strong>'
      }
    },
    {
      id: 7,
      difficulty: 'Hard',
      title: 'Dynamic Top N Products',
      prompt: 'Write a DAX measure that calculates the total revenue from only the Top 5 products (by revenue). This should be dynamic — as users apply filters (e.g., selecting a specific store), the Top 5 should recalculate based on the filtered data.',
      hints: [
        'TOPN returns a table of the top N rows based on an expression.',
        'Use TOPN inside CALCULATE as a filter.',
        'ALL(Dim_Product) ensures you rank against all products (not just the currently selected one).',
        'TOPN( 5, ALL(Dim_Product), [Total Revenue] ) gives you the top 5 products.'
      ],
      solution: {
        formula: 'Top 5 Products Revenue =\n    CALCULATE(\n        [Total Revenue],\n        TOPN(\n            5,\n            ALL( Dim_Product ),\n            [Total Revenue]\n        )\n    )',
        explanation: 'TOPN(5, ALL(Dim_Product), [Total Revenue]) creates a virtual table of the top 5 products ranked by revenue (using ALL to consider all products, not just filtered ones). CALCULATE then evaluates [Total Revenue] only for those 5 products. This is dynamic — if you filter to a specific store, the Top 5 recalculates based on that store\'s data.'
      }
    }
  ];

  // ══════════════════════════════════════════
  // SQL PRACTICE PROBLEMS (PostgreSQL)
  // ══════════════════════════════════════════

  var sqlPracticeProblems = [
    // ── EASY ──
    {
      id: 1, difficulty: 'Easy', title: 'List All Products in Produce',
      prompt: 'Write a query to list all product names and their retail price from the <code>products</code> table where the product belongs to the "Produce" category. You will need to join with the subcategories and categories tables.',
      hints: ['JOIN products → subcategories → categories', 'Use WHERE on category_name', 'Watch out for inconsistent casing in category_name — use ILIKE or LOWER()'],
      solution: {
        code: 'SELECT p.product_name, p.retail_price\nFROM products p\nJOIN subcategories sc ON p.subcategory_id = sc.subcategory_id\nJOIN categories c ON sc.category_id = c.category_id\nWHERE LOWER(c.category_name) = \'produce\'\nORDER BY p.retail_price DESC;',
        explanation: 'We need two JOINs to traverse from products → subcategories → categories. Using LOWER() handles the casing inconsistency in the data (some categories are stored as "Produce", "dairy", "BEVERAGES").'
      }
    },
    {
      id: 2, difficulty: 'Easy', title: 'Count Transactions Per Store',
      prompt: 'Write a query that counts the total number of transactions for each store. Show the store name and the transaction count, ordered by count descending.',
      hints: ['JOIN transactions with stores', 'Use GROUP BY and COUNT()', 'Remember to exclude TEST transactions'],
      solution: {
        code: 'SELECT s.store_name, COUNT(*) AS transaction_count\nFROM transactions t\nJOIN stores s ON t.store_id = s.store_id\nWHERE t.transaction_id NOT LIKE \'TEST%\'\nGROUP BY s.store_name\nORDER BY transaction_count DESC;',
        explanation: 'GROUP BY store_name aggregates rows per store. COUNT(*) counts all rows in each group. The WHERE clause filters out test transactions.'
      }
    },
    {
      id: 3, difficulty: 'Easy', title: 'Find the Most Expensive Product',
      prompt: 'Write a query to find the product with the highest retail price. Return the product name, brand, and price.',
      hints: ['ORDER BY retail_price DESC', 'Use LIMIT 1'],
      solution: {
        code: 'SELECT product_name, brand, retail_price\nFROM products\nORDER BY retail_price DESC\nLIMIT 1;',
        explanation: 'Simple sorting with LIMIT. In PostgreSQL, LIMIT 1 returns just the top row. Alternative: use a subquery with MAX(retail_price).'
      }
    },
    {
      id: 4, difficulty: 'Easy', title: 'Customers Who Joined in 2024',
      prompt: 'Write a query to find all customers who joined in the year 2024. Show their full name (first + last), city, membership tier, and join date.',
      hints: ['Use EXTRACT(YEAR FROM join_date) or join_date BETWEEN', 'Concatenate first_name and last_name with ||'],
      solution: {
        code: 'SELECT first_name || \' \' || last_name AS full_name,\n       city, membership_tier, join_date\nFROM customers\nWHERE EXTRACT(YEAR FROM join_date::date) = 2024\nORDER BY join_date;',
        explanation: 'EXTRACT(YEAR FROM date) pulls just the year. The || operator concatenates strings in PostgreSQL. We cast join_date to date type if it is stored as text.'
      }
    },
    {
      id: 5, difficulty: 'Easy', title: 'Products Per Category Count',
      prompt: 'Write a query that shows how many products exist in each category. Display category name and product count.',
      hints: ['Three-table JOIN: products → subcategories → categories', 'GROUP BY category_name'],
      solution: {
        code: 'SELECT c.category_name, COUNT(p.product_id) AS product_count\nFROM categories c\nLEFT JOIN subcategories sc ON c.category_id = sc.category_id\nLEFT JOIN products p ON sc.subcategory_id = p.subcategory_id\nGROUP BY c.category_name\nORDER BY product_count DESC;',
        explanation: 'LEFT JOINs ensure we see categories even if they have no products. COUNT on product_id ignores NULLs, giving accurate counts.'
      }
    },
    // ── MEDIUM ──
    {
      id: 6, difficulty: 'Medium', title: 'Total Revenue Per Store',
      prompt: 'Calculate the total revenue for each store. Revenue per line item = quantity * unit_price * (1 - discount_percent/100). Handle NULL discounts as 0. Show store name, city, and total revenue formatted to 2 decimal places.',
      hints: ['JOIN transaction_items → transactions → stores', 'Use COALESCE(discount_percent, 0) for NULL discounts', 'Filter out test transactions and returns (negative qty)'],
      solution: {
        code: 'SELECT s.store_name, s.city,\n       ROUND(SUM(\n         ti.quantity * ti.unit_price *\n         (1 - COALESCE(ti.discount_percent, 0) / 100.0)\n       ), 2) AS total_revenue\nFROM transaction_items ti\nJOIN transactions t ON ti.transaction_id = t.transaction_id\nJOIN stores s ON t.store_id = s.store_id\nWHERE t.transaction_id NOT LIKE \'TEST%\'\n  AND ti.quantity > 0\nGROUP BY s.store_name, s.city\nORDER BY total_revenue DESC;',
        explanation: 'COALESCE replaces NULL with 0. We divide by 100.0 (not 100) to force decimal division. ROUND formats to 2 decimal places. Filtering quantity > 0 excludes returns.'
      }
    },
    {
      id: 7, difficulty: 'Medium', title: 'Top 5 Customers by Spending',
      prompt: 'Find the top 5 customers by total spending. Show customer name, membership tier, total revenue, and number of transactions. Exclude walk-in (NULL customer_id) transactions.',
      hints: ['JOIN transaction_items → transactions → customers', 'Use COUNT(DISTINCT transaction_id) for transaction count', 'LIMIT 5'],
      solution: {
        code: 'SELECT c.first_name || \' \' || c.last_name AS customer_name,\n       c.membership_tier,\n       ROUND(SUM(\n         ti.quantity * ti.unit_price *\n         (1 - COALESCE(ti.discount_percent, 0) / 100.0)\n       ), 2) AS total_spent,\n       COUNT(DISTINCT t.transaction_id) AS num_transactions\nFROM transaction_items ti\nJOIN transactions t ON ti.transaction_id = t.transaction_id\nJOIN customers c ON t.customer_id = c.customer_id\nWHERE t.transaction_id NOT LIKE \'TEST%\'\n  AND ti.quantity > 0\nGROUP BY c.customer_id, c.first_name, c.last_name, c.membership_tier\nORDER BY total_spent DESC\nLIMIT 5;',
        explanation: 'The JOIN on customer_id naturally excludes NULLs (walk-ins). COUNT(DISTINCT) ensures each transaction is counted once even though it has multiple line items.'
      }
    },
    {
      id: 8, difficulty: 'Medium', title: 'Monthly Revenue Trend',
      prompt: 'Write a query that shows total revenue by month (YYYY-MM format). Order chronologically. This gives you the data for a monthly trend line chart.',
      hints: ['Use TO_CHAR(date, \'YYYY-MM\') to extract month', 'GROUP BY the month expression', 'Cast transaction_date if needed'],
      solution: {
        code: 'SELECT TO_CHAR(t.transaction_date::date, \'YYYY-MM\') AS month,\n       ROUND(SUM(\n         ti.quantity * ti.unit_price *\n         (1 - COALESCE(ti.discount_percent, 0) / 100.0)\n       ), 2) AS monthly_revenue\nFROM transaction_items ti\nJOIN transactions t ON ti.transaction_id = t.transaction_id\nWHERE t.transaction_id NOT LIKE \'TEST%\'\n  AND ti.quantity > 0\n  AND t.transaction_date::date <= \'2024-12-31\'\nGROUP BY TO_CHAR(t.transaction_date::date, \'YYYY-MM\')\nORDER BY month;',
        explanation: 'TO_CHAR formats the date as YYYY-MM for monthly grouping. The date filter removes future-dated errors. This query output can be directly used as a line chart data source.'
      }
    },
    {
      id: 9, difficulty: 'Medium', title: 'Products Never Returned',
      prompt: 'Find all products that have never been returned (never appeared with a negative quantity in transaction_items). Show product name and total quantity sold.',
      hints: ['A return is indicated by quantity < 0', 'Use NOT IN or NOT EXISTS with a subquery', 'Or use HAVING with conditional aggregation'],
      solution: {
        code: 'SELECT p.product_name,\n       SUM(ti.quantity) AS total_qty_sold\nFROM products p\nJOIN transaction_items ti ON p.product_id = ti.product_id\nWHERE p.product_id NOT IN (\n  SELECT DISTINCT product_id\n  FROM transaction_items\n  WHERE quantity < 0\n)\nGROUP BY p.product_name\nORDER BY total_qty_sold DESC;',
        explanation: 'The subquery finds all product_ids that have at least one return. NOT IN excludes them. Alternative approach: LEFT JOIN + IS NULL, or NOT EXISTS.'
      }
    },
    {
      id: 10, difficulty: 'Medium', title: 'Revenue by Region and Category',
      prompt: 'Create a cross-tabulation showing total revenue by region (rows) and product category (columns). This is the data behind a matrix visual in Power BI.',
      hints: ['Use conditional aggregation: SUM(CASE WHEN ... THEN revenue END)', 'Join all the way from transaction_items to stores and categories', 'Use CROSSTAB or manual CASE WHEN pivot'],
      solution: {
        code: 'SELECT s.region,\n       ROUND(SUM(CASE WHEN LOWER(cat.category_name) = \'produce\'\n         THEN ti.quantity * ti.unit_price * (1 - COALESCE(ti.discount_percent,0)/100.0) END), 2) AS produce,\n       ROUND(SUM(CASE WHEN LOWER(cat.category_name) = \'dairy\'\n         THEN ti.quantity * ti.unit_price * (1 - COALESCE(ti.discount_percent,0)/100.0) END), 2) AS dairy,\n       ROUND(SUM(CASE WHEN LOWER(cat.category_name) = \'bakery\'\n         THEN ti.quantity * ti.unit_price * (1 - COALESCE(ti.discount_percent,0)/100.0) END), 2) AS bakery,\n       ROUND(SUM(CASE WHEN LOWER(cat.category_name) = \'beverages\'\n         THEN ti.quantity * ti.unit_price * (1 - COALESCE(ti.discount_percent,0)/100.0) END), 2) AS beverages,\n       ROUND(SUM(CASE WHEN LOWER(cat.category_name) = \'snacks\'\n         THEN ti.quantity * ti.unit_price * (1 - COALESCE(ti.discount_percent,0)/100.0) END), 2) AS snacks\nFROM transaction_items ti\nJOIN transactions t ON ti.transaction_id = t.transaction_id\nJOIN stores s ON t.store_id = s.store_id\nJOIN products p ON ti.product_id = p.product_id\nJOIN subcategories sc ON p.subcategory_id = sc.subcategory_id\nJOIN categories cat ON sc.category_id = cat.category_id\nWHERE t.transaction_id NOT LIKE \'TEST%\' AND ti.quantity > 0\nGROUP BY s.region\nORDER BY s.region;',
        explanation: 'Manual pivoting with CASE WHEN. Each CASE produces a value only for its category, so SUM aggregates just that category. This is how you create a "matrix" style result in SQL. PostgreSQL also supports the tablefunc extension with CROSSTAB for dynamic pivoting.'
      }
    },
    // ── HARD ──
    {
      id: 11, difficulty: 'Hard', title: 'Running Total by Month (Window Function)',
      prompt: 'Write a query that shows monthly revenue with a running (cumulative) total that resets each year. Use window functions.',
      hints: ['First calculate monthly revenue in a CTE', 'Use SUM() OVER (PARTITION BY year ORDER BY month)', 'PARTITION BY resets the running total each year'],
      solution: {
        code: 'WITH monthly AS (\n  SELECT\n    EXTRACT(YEAR FROM t.transaction_date::date) AS yr,\n    TO_CHAR(t.transaction_date::date, \'YYYY-MM\') AS month,\n    ROUND(SUM(\n      ti.quantity * ti.unit_price *\n      (1 - COALESCE(ti.discount_percent, 0) / 100.0)\n    ), 2) AS revenue\n  FROM transaction_items ti\n  JOIN transactions t ON ti.transaction_id = t.transaction_id\n  WHERE t.transaction_id NOT LIKE \'TEST%\'\n    AND ti.quantity > 0\n    AND t.transaction_date::date <= \'2024-12-31\'\n  GROUP BY yr, month\n)\nSELECT month, revenue,\n       SUM(revenue) OVER (\n         PARTITION BY yr ORDER BY month\n       ) AS ytd_running_total\nFROM monthly\nORDER BY month;',
        explanation: 'The CTE calculates monthly revenue. The window function SUM() OVER (PARTITION BY yr ORDER BY month) accumulates revenue within each year. PARTITION BY resets the total at each new year — matching TOTALYTD behavior in DAX.'
      }
    },
    {
      id: 12, difficulty: 'Hard', title: 'Rank Stores by Revenue (DENSE_RANK)',
      prompt: 'Rank all stores by total revenue using DENSE_RANK(). Also show each store\'s percentage of total revenue across all stores.',
      hints: ['Window function DENSE_RANK() OVER (ORDER BY revenue DESC)', 'For % of total, use SUM() OVER () with no partition (grand total)', 'Combine in a CTE or subquery'],
      solution: {
        code: 'WITH store_rev AS (\n  SELECT s.store_name, s.city, s.region,\n         ROUND(SUM(\n           ti.quantity * ti.unit_price *\n           (1 - COALESCE(ti.discount_percent, 0) / 100.0)\n         ), 2) AS revenue\n  FROM transaction_items ti\n  JOIN transactions t ON ti.transaction_id = t.transaction_id\n  JOIN stores s ON t.store_id = s.store_id\n  WHERE t.transaction_id NOT LIKE \'TEST%\' AND ti.quantity > 0\n  GROUP BY s.store_name, s.city, s.region\n)\nSELECT store_name, city, region, revenue,\n       DENSE_RANK() OVER (ORDER BY revenue DESC) AS rank,\n       ROUND(revenue * 100.0 / SUM(revenue) OVER (), 2) AS pct_of_total\nFROM store_rev\nORDER BY rank;',
        explanation: 'DENSE_RANK assigns ranks without gaps. SUM(revenue) OVER() with no PARTITION BY gives the grand total — dividing each store\'s revenue by this produces the percentage. This mirrors the "Store % of Total" DAX measure.'
      }
    },
    {
      id: 13, difficulty: 'Hard', title: 'Month-over-Month Growth (LAG)',
      prompt: 'Calculate month-over-month revenue growth percentage using the LAG() window function. Show month, revenue, previous month revenue, and growth %.',
      hints: ['LAG(revenue, 1) OVER (ORDER BY month) gets previous month', 'Growth = (current - previous) / previous * 100', 'Handle the first month (NULL previous) with COALESCE or a CASE'],
      solution: {
        code: 'WITH monthly AS (\n  SELECT\n    TO_CHAR(t.transaction_date::date, \'YYYY-MM\') AS month,\n    ROUND(SUM(\n      ti.quantity * ti.unit_price *\n      (1 - COALESCE(ti.discount_percent, 0) / 100.0)\n    ), 2) AS revenue\n  FROM transaction_items ti\n  JOIN transactions t ON ti.transaction_id = t.transaction_id\n  WHERE t.transaction_id NOT LIKE \'TEST%\'\n    AND ti.quantity > 0\n    AND t.transaction_date::date <= \'2024-12-31\'\n  GROUP BY month\n)\nSELECT month, revenue,\n       LAG(revenue) OVER (ORDER BY month) AS prev_month_revenue,\n       CASE\n         WHEN LAG(revenue) OVER (ORDER BY month) IS NOT NULL\n           AND LAG(revenue) OVER (ORDER BY month) > 0\n         THEN ROUND(\n           (revenue - LAG(revenue) OVER (ORDER BY month)) * 100.0 /\n           LAG(revenue) OVER (ORDER BY month), 2\n         )\n       END AS mom_growth_pct\nFROM monthly\nORDER BY month;',
        explanation: 'LAG(revenue) looks at the previous row\'s revenue (ordered by month). The CASE handles the first month where there is no previous value. This is the SQL equivalent of the MoM Growth % DAX measure.'
      }
    },
    {
      id: 14, difficulty: 'Hard', title: 'Most Popular Product Per Category',
      prompt: 'For each product category, find the single best-selling product (highest total revenue). Use a CTE with ROW_NUMBER().',
      hints: ['Calculate revenue per product in a CTE', 'Use ROW_NUMBER() OVER (PARTITION BY category ORDER BY revenue DESC)', 'Filter WHERE row_num = 1 in the outer query'],
      solution: {
        code: 'WITH product_rev AS (\n  SELECT\n    INITCAP(LOWER(cat.category_name)) AS category,\n    TRIM(p.product_name) AS product_name,\n    ROUND(SUM(\n      ti.quantity * ti.unit_price *\n      (1 - COALESCE(ti.discount_percent, 0) / 100.0)\n    ), 2) AS revenue,\n    ROW_NUMBER() OVER (\n      PARTITION BY LOWER(cat.category_name)\n      ORDER BY SUM(ti.quantity * ti.unit_price *\n        (1 - COALESCE(ti.discount_percent, 0) / 100.0)) DESC\n    ) AS rn\n  FROM transaction_items ti\n  JOIN products p ON ti.product_id = p.product_id\n  JOIN subcategories sc ON p.subcategory_id = sc.subcategory_id\n  JOIN categories cat ON sc.category_id = cat.category_id\n  WHERE ti.quantity > 0\n  GROUP BY LOWER(cat.category_name), TRIM(p.product_name)\n)\nSELECT category, product_name, revenue\nFROM product_rev\nWHERE rn = 1\nORDER BY revenue DESC;',
        explanation: 'ROW_NUMBER() OVER (PARTITION BY category ORDER BY revenue DESC) assigns rank 1 to the top product within each category. Filtering rn = 1 keeps only the best seller per category. INITCAP normalizes the casing.'
      }
    },
    {
      id: 15, difficulty: 'Hard', title: 'Geographic Revenue Analysis',
      prompt: 'Write a query that shows revenue by city with the store\'s latitude/longitude, number of stores in that city, and average revenue per store. This data can power a map visualization.',
      hints: ['GROUP BY city and use aggregate functions on lat/lng (AVG for center point)', 'COUNT(DISTINCT store_id) for number of stores', 'JOIN through transactions to get revenue'],
      solution: {
        code: 'SELECT s.city, s.state,\n       ROUND(AVG(s.latitude), 4) AS center_lat,\n       ROUND(AVG(s.longitude), 4) AS center_lng,\n       COUNT(DISTINCT s.store_id) AS num_stores,\n       ROUND(SUM(\n         ti.quantity * ti.unit_price *\n         (1 - COALESCE(ti.discount_percent, 0) / 100.0)\n       ), 2) AS total_revenue,\n       ROUND(SUM(\n         ti.quantity * ti.unit_price *\n         (1 - COALESCE(ti.discount_percent, 0) / 100.0)\n       ) / COUNT(DISTINCT s.store_id), 2) AS avg_revenue_per_store\nFROM transaction_items ti\nJOIN transactions t ON ti.transaction_id = t.transaction_id\nJOIN stores s ON t.store_id = s.store_id\nWHERE t.transaction_id NOT LIKE \'TEST%\' AND ti.quantity > 0\nGROUP BY s.city, s.state\nORDER BY total_revenue DESC;',
        explanation: 'AVG(latitude) and AVG(longitude) give the geographic center for cities with multiple stores. This query output has everything needed for a map visual: coordinates, size metric (revenue), and tooltip data.'
      }
    }
  ];

  // ══════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════

  return {
    businessRequirements: businessRequirements,
    sourceData: sourceData,
    transformationSteps: transformationSteps,
    dataModel: dataModel,
    reports: reports,
    daxMeasures: daxMeasures,
    practiceProblems: practiceProblems,
    sqlPracticeProblems: sqlPracticeProblems
  };

})();
