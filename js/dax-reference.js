/* ============================================
   DAX Function Reference Encyclopedia
   Shared across all scenarios
   ============================================ */

window.DAXReference = {

  'SUM': {
    syntax: 'SUM( <column> )',
    description: 'Adds up all the numbers in a single column. This is the simplest aggregation function in DAX. It works only on columns — if you need to sum the result of an expression evaluated row-by-row, use SUMX instead.',
    returnType: 'Decimal number',
    parameters: [
      { name: 'column', description: 'A column containing numbers you want to total. Must be a direct column reference like Table[Column].' }
    ],
    examples: [
      { formula: 'SUM( Sales[Amount] )', context: 'Total of all values in Amount column', result: '125,430.50' },
      { formula: 'Total Revenue = SUM( Fact_Sales[SalesAmount] )', context: 'Measure that totals all sales', result: 'Varies by filter context' }
    ],
    notes: 'SUM only accepts a column reference. You cannot write SUM(Price * Qty) — use SUMX for that. SUM ignores blanks but includes zero values.',
    relatedFunctions: ['SUMX', 'AVERAGE', 'COUNT', 'CALCULATE']
  },

  'SUMX': {
    syntax: 'SUMX( <table>, <expression> )',
    description: 'Iterates over each row of a table, evaluates the expression for that row, then sums all the results. Think of it as a loop: for each row, calculate something, then add it all up. This is an "iterator" function — the X stands for "each row".',
    returnType: 'Decimal number',
    parameters: [
      { name: 'table', description: 'The table to iterate over. Can be a physical table or a table expression.' },
      { name: 'expression', description: 'An expression evaluated for each row of the table. Can reference columns from the table.' }
    ],
    examples: [
      { formula: 'SUMX( Sales, Sales[Qty] * Sales[Price] )', context: 'Calculate revenue row-by-row then sum', result: '98,320.00' },
      { formula: 'SUMX( Products, Products[Stock] * Products[Cost] )', context: 'Total inventory value', result: '45,600.00' }
    ],
    notes: 'SUMX is slower than SUM because it evaluates an expression per row. Use SUM when you can (simple column sum). Use SUMX when you need row-level calculations like Qty * Price. The table parameter can be filtered using FILTER().',
    relatedFunctions: ['SUM', 'AVERAGEX', 'COUNTX', 'FILTER']
  },

  'CALCULATE': {
    syntax: 'CALCULATE( <expression>, <filter1>, <filter2>, ... )',
    description: 'The most important and powerful function in DAX. It evaluates an expression in a modified filter context. In plain English: "Calculate this measure, BUT change which rows are included." Every filter you add narrows down which rows the expression sees.',
    returnType: 'Whatever the expression returns',
    parameters: [
      { name: 'expression', description: 'The value to calculate — usually a measure like [Total Revenue] or an aggregation like SUM(...).' },
      { name: 'filter1, filter2, ...', description: 'One or more filter conditions that modify the context. Can be boolean expressions, table expressions, or filter modification functions like ALL(), REMOVEFILTERS().' }
    ],
    examples: [
      { formula: 'CALCULATE( [Total Revenue], Products[Category] = "Produce" )', context: 'Revenue for only Produce category', result: '34,560.00' },
      { formula: 'CALCULATE( [Total Revenue], ALL( Dim_Store ) )', context: 'Revenue ignoring any store filters', result: '125,430.50 (grand total)' },
      { formula: 'CALCULATE( [Total Revenue], DATEADD( Dim_Date[Date], -1, MONTH ) )', context: 'Revenue from previous month', result: 'Varies by current month context' }
    ],
    notes: 'CALCULATE modifies the filter context — it does not create row context. Filters in CALCULATE override existing filters on the same column. Use ALL() inside CALCULATE to remove filters. CALCULATE is the gateway to time intelligence, percentage-of-total, and virtually all advanced DAX patterns.',
    relatedFunctions: ['ALL', 'FILTER', 'REMOVEFILTERS', 'DATEADD', 'SAMEPERIODLASTYEAR']
  },

  'DIVIDE': {
    syntax: 'DIVIDE( <numerator>, <denominator>, <alternateResult> )',
    description: 'Performs safe division. Returns the alternate result (default BLANK) when the denominator is zero or BLANK, avoiding ugly division-by-zero errors. Always prefer DIVIDE over the "/" operator when the denominator might be zero.',
    returnType: 'Decimal number',
    parameters: [
      { name: 'numerator', description: 'The number to divide (the top of the fraction).' },
      { name: 'denominator', description: 'The number to divide by (the bottom of the fraction).' },
      { name: 'alternateResult', description: 'Optional. Value returned when denominator is 0 or BLANK. Defaults to BLANK().' }
    ],
    examples: [
      { formula: 'DIVIDE( 100, 4 )', context: 'Simple division', result: '25' },
      { formula: 'DIVIDE( 100, 0 )', context: 'Division by zero — returns BLANK', result: 'BLANK' },
      { formula: 'DIVIDE( 100, 0, 0 )', context: 'Division by zero with alternate = 0', result: '0' },
      { formula: 'DIVIDE( [Profit], [Revenue], 0 )', context: 'Profit margin (safe)', result: '0.23 (23%)' }
    ],
    notes: 'Always use DIVIDE instead of "/" in measures where the denominator could be zero. The "/" operator throws an error on division by zero. DIVIDE is also slightly more readable. Format the result as percentage in Power BI if needed.',
    relatedFunctions: ['SUM', 'CALCULATE', 'IF', 'BLANK']
  },

  'RELATED': {
    syntax: 'RELATED( <column> )',
    description: 'Fetches a value from a related table (the "one" side of a relationship). Works like a VLOOKUP — it follows the relationship from the current row\'s table to the related table and brings back the matching value. Only works in row context (calculated columns or inside iterators like SUMX).',
    returnType: 'The data type of the referenced column',
    parameters: [
      { name: 'column', description: 'A column from a related table on the "one" side of the relationship.' }
    ],
    examples: [
      { formula: 'RELATED( Dim_Product[CategoryName] )', context: 'In Fact_Sales, get the product category', result: '"Produce"' },
      { formula: 'SUMX( Fact_Sales, Fact_Sales[Qty] * RELATED( Dim_Product[CostPrice] ) )', context: 'Total cost using price from product dimension', result: '78,230.00' }
    ],
    notes: 'RELATED requires an active relationship between the tables. It follows many-to-one direction (from fact to dimension). For the opposite direction (one-to-many), use RELATEDTABLE. RELATED only works in row context — you cannot use it directly in a measure without an iterator.',
    relatedFunctions: ['RELATEDTABLE', 'LOOKUPVALUE', 'SUMX']
  },

  'DISTINCTCOUNT': {
    syntax: 'DISTINCTCOUNT( <column> )',
    description: 'Counts the number of unique (distinct) values in a column. Duplicate values are counted only once. BLANK is counted as one value if present. Useful for counting unique customers, transactions, products, etc.',
    returnType: 'Whole number',
    parameters: [
      { name: 'column', description: 'The column to count distinct values from.' }
    ],
    examples: [
      { formula: 'DISTINCTCOUNT( Sales[CustomerID] )', context: 'Count unique customers', result: '187' },
      { formula: 'DISTINCTCOUNT( Sales[TransactionID] )', context: 'Count unique transactions', result: '2,000' }
    ],
    notes: 'DISTINCTCOUNT counts BLANK as a value. If you want to exclude BLANK, use CALCULATE + FILTER. DISTINCTCOUNT is equivalent to COUNTROWS(DISTINCT(column)) but more concise. For counting rows (not distinct), use COUNTROWS.',
    relatedFunctions: ['COUNT', 'COUNTROWS', 'COUNTA', 'VALUES']
  },

  'TOPN': {
    syntax: 'TOPN( <n>, <table>, <expression>, <order> )',
    description: 'Returns the top N rows of a table based on an expression. It first sorts the table by the expression (descending by default), then returns the first N rows. This is a TABLE function — it returns a table, not a single value.',
    returnType: 'Table',
    parameters: [
      { name: 'n', description: 'Number of rows to return.' },
      { name: 'table', description: 'The table to get top rows from. Can use ALL(Table) to ignore current filters.' },
      { name: 'expression', description: 'The expression to sort by (e.g., [Total Revenue]).' },
      { name: 'order', description: 'Optional. 1 = ascending (bottom N), 0 = descending (top N, default).' }
    ],
    examples: [
      { formula: 'TOPN( 5, ALL( Products ), [Total Revenue] )', context: 'Table of top 5 products by revenue', result: '(table with 5 rows)' },
      { formula: 'CALCULATE( [Total Revenue], TOPN( 10, ALL( Dim_Product ), [Total Revenue] ) )', context: 'Revenue from top 10 products', result: '67,890.00' }
    ],
    notes: 'TOPN returns a table, so it is often used inside CALCULATE as a filter. Ties are included — if positions 5 and 6 have the same value, both are returned. Use with ALL() to ignore current slicer filters when ranking.',
    relatedFunctions: ['CALCULATE', 'ALL', 'RANKX', 'FILTER']
  },

  'DATEADD': {
    syntax: 'DATEADD( <dates>, <numberOfIntervals>, <interval> )',
    description: 'Shifts a set of dates forward or backward in time. Used inside CALCULATE for time comparisons like "previous month" or "same quarter last year". The dates column must come from a proper Date table marked as a date table.',
    returnType: 'Table of dates',
    parameters: [
      { name: 'dates', description: 'A column of dates from your Date table (e.g., Dim_Date[Date]).' },
      { name: 'numberOfIntervals', description: 'How many intervals to shift. Negative = past, Positive = future.' },
      { name: 'interval', description: 'The time unit: DAY, MONTH, QUARTER, or YEAR.' }
    ],
    examples: [
      { formula: 'CALCULATE( [Revenue], DATEADD( Dim_Date[Date], -1, MONTH ) )', context: 'Revenue from previous month', result: 'Previous month total' },
      { formula: 'CALCULATE( [Revenue], DATEADD( Dim_Date[Date], -1, YEAR ) )', context: 'Revenue from same period last year', result: 'Last year total' }
    ],
    notes: 'DATEADD requires a contiguous date table (no gaps). The Date table must be marked as a date table in Power BI (Model tab > Mark as Date Table). If time intelligence functions are not working, check your date table first!',
    relatedFunctions: ['SAMEPERIODLASTYEAR', 'TOTALYTD', 'TOTALMTD', 'CALCULATE']
  },

  'TOTALYTD': {
    syntax: 'TOTALYTD( <expression>, <dates>, <filter>, <yearEndDate> )',
    description: 'Calculates the year-to-date (YTD) value of an expression. It automatically accumulates from the start of the year to the current date in context. Shorthand for CALCULATE with DATESYTD.',
    returnType: 'Whatever the expression returns',
    parameters: [
      { name: 'expression', description: 'The measure to accumulate (e.g., [Total Revenue]).' },
      { name: 'dates', description: 'A date column from your Date table.' },
      { name: 'filter', description: 'Optional. Additional filter to apply.' },
      { name: 'yearEndDate', description: 'Optional. Year end date if your fiscal year doesn\'t end Dec 31 (e.g., "06/30" for June fiscal year end).' }
    ],
    examples: [
      { formula: 'TOTALYTD( [Total Revenue], Dim_Date[Date] )', context: 'Revenue accumulated from Jan 1 to current date', result: 'YTD total' },
      { formula: 'TOTALYTD( [Total Revenue], Dim_Date[Date], , "06/30" )', context: 'Fiscal YTD (July-June fiscal year)', result: 'Fiscal YTD total' }
    ],
    notes: 'Requires a proper date table. The accumulation resets at the start of each year. Use TOTALMTD for month-to-date and TOTALQTD for quarter-to-date.',
    relatedFunctions: ['TOTALMTD', 'TOTALQTD', 'DATESYTD', 'CALCULATE', 'DATEADD']
  },

  'SAMEPERIODLASTYEAR': {
    syntax: 'SAMEPERIODLASTYEAR( <dates> )',
    description: 'Returns a table of dates shifted exactly one year back. Used inside CALCULATE to compare current period with the same period last year. The simplest way to do year-over-year comparisons.',
    returnType: 'Table of dates',
    parameters: [
      { name: 'dates', description: 'A date column from your Date table.' }
    ],
    examples: [
      { formula: 'CALCULATE( [Revenue], SAMEPERIODLASTYEAR( Dim_Date[Date] ) )', context: 'Revenue for same dates, one year ago', result: 'Last year total' }
    ],
    notes: 'This is equivalent to DATEADD(dates, -1, YEAR) but more readable. Requires a date table with data for the previous year — if last year\'s dates don\'t exist in the date table, results will be BLANK.',
    relatedFunctions: ['DATEADD', 'CALCULATE', 'TOTALYTD', 'PREVIOUSMONTH']
  },

  'ALL': {
    syntax: 'ALL( <tableOrColumn>, ... )',
    description: 'Removes all filters from a table or column(s). Used inside CALCULATE to ignore slicer and filter selections. Essential for calculating percentages of total and grand totals that shouldn\'t change with filters.',
    returnType: 'Table',
    parameters: [
      { name: 'tableOrColumn', description: 'A table name or one or more column references. ALL(Table) removes all filters on the entire table. ALL(Table[Col]) removes filter on just that column.' }
    ],
    examples: [
      { formula: 'CALCULATE( [Revenue], ALL( Dim_Product ) )', context: 'Total revenue ignoring product filters', result: 'Grand total regardless of product selection' },
      { formula: 'DIVIDE( [Revenue], CALCULATE( [Revenue], ALL( Dim_Store ) ) )', context: 'Each store\'s % of total revenue', result: '0.15 (15%)' }
    ],
    notes: 'ALL is the most common way to calculate "percentage of total" patterns. ALL(Table) removes row filters AND slicer filters on that table. Use ALLEXCEPT to remove all filters EXCEPT specific columns. Use ALLSELECTED to respect slicer context but remove row-level filters.',
    relatedFunctions: ['ALLEXCEPT', 'ALLSELECTED', 'REMOVEFILTERS', 'CALCULATE', 'FILTER']
  },

  'FILTER': {
    syntax: 'FILTER( <table>, <condition> )',
    description: 'Returns a table containing only rows where the condition is TRUE. It iterates row-by-row and keeps rows that pass the test. Often used inside CALCULATE to apply complex filter conditions.',
    returnType: 'Table',
    parameters: [
      { name: 'table', description: 'The table to filter. Can be a physical table or table expression.' },
      { name: 'condition', description: 'A TRUE/FALSE expression evaluated for each row.' }
    ],
    examples: [
      { formula: 'FILTER( Products, Products[Price] > 50 )', context: 'Only products costing more than $50', result: '(table of expensive products)' },
      { formula: 'CALCULATE( [Revenue], FILTER( ALL(Products), Products[Category] = "Produce" ) )', context: 'Revenue for Produce, ignoring other product filters', result: '34,560.00' }
    ],
    notes: 'FILTER is an iterator — it checks each row, which can be slow on large tables. For simple column = value conditions inside CALCULATE, use the direct syntax: CALCULATE([Revenue], Products[Category] = "Produce") which is faster. Use FILTER when your condition involves measures or complex logic.',
    relatedFunctions: ['CALCULATE', 'ALL', 'COUNTROWS', 'SUMX']
  },

  'VALUES': {
    syntax: 'VALUES( <column> )',
    description: 'Returns a one-column table of unique values from a column, respecting the current filter context. If the column has blanks, a blank row is added. Useful for iterating over distinct values or checking if a single value is selected.',
    returnType: 'Table',
    parameters: [
      { name: 'column', description: 'A column to get distinct values from.' }
    ],
    examples: [
      { formula: 'COUNTROWS( VALUES( Sales[ProductID] ) )', context: 'Count distinct products in current context', result: '42' },
      { formula: 'IF( COUNTROWS( VALUES( Dim_Store[StoreName] ) ) = 1, VALUES( Dim_Store[StoreName] ), "Multiple" )', context: 'Show store name if single store selected', result: '"Downtown Store" or "Multiple"' }
    ],
    notes: 'VALUES respects filters, DISTINCT does not include blank rows. VALUES is commonly used with COUNTROWS to check how many items are selected. When exactly one value is selected, VALUES can return that single value for display.',
    relatedFunctions: ['DISTINCT', 'ALL', 'COUNTROWS', 'HASONEVALUE']
  },

  'AVERAGEX': {
    syntax: 'AVERAGEX( <table>, <expression> )',
    description: 'Iterates over each row of a table, evaluates the expression, then returns the average of all results. The "X" version of AVERAGE — use it when you need to average a calculated value rather than a simple column.',
    returnType: 'Decimal number',
    parameters: [
      { name: 'table', description: 'The table to iterate over.' },
      { name: 'expression', description: 'An expression evaluated for each row.' }
    ],
    examples: [
      { formula: 'AVERAGEX( Sales, Sales[Qty] * Sales[Price] )', context: 'Average line item revenue', result: '24.58' },
      { formula: 'AVERAGEX( VALUES( Dim_Store[StoreName] ), [Total Revenue] )', context: 'Average revenue per store', result: '25,086.10' }
    ],
    notes: 'AVERAGEX first iterates to calculate per-row values, then averages them. This is different from SUM/COUNT which would give a weighted average. Use AVERAGEX with VALUES to get "average per category" type calculations.',
    relatedFunctions: ['SUMX', 'COUNTX', 'AVERAGE', 'VALUES']
  },

  'COUNTROWS': {
    syntax: 'COUNTROWS( <table> )',
    description: 'Counts the number of rows in a table. Simple but powerful — often used with FILTER, VALUES, or DISTINCT to count filtered or unique items.',
    returnType: 'Whole number',
    parameters: [
      { name: 'table', description: 'A table or table expression.' }
    ],
    examples: [
      { formula: 'COUNTROWS( Fact_Sales )', context: 'Total number of sales rows', result: '8,000' },
      { formula: 'COUNTROWS( FILTER( Products, Products[Price] > 50 ) )', context: 'Count products over $50', result: '12' }
    ],
    notes: 'COUNTROWS counts all rows including those with blanks. It is often more reliable than COUNT which only counts non-blank values in a column. Combine with FILTER for conditional counting.',
    relatedFunctions: ['COUNT', 'COUNTA', 'DISTINCTCOUNT', 'FILTER', 'VALUES']
  },

  'RANKX': {
    syntax: 'RANKX( <table>, <expression>, <value>, <order>, <ties> )',
    description: 'Returns the rank of the current row\'s value within a table. Great for ranking products by sales, stores by revenue, etc. The function evaluates the expression for each row in the table and determines the position.',
    returnType: 'Whole number',
    parameters: [
      { name: 'table', description: 'The table to rank within. Use ALL(Table) to rank against all items regardless of filters.' },
      { name: 'expression', description: 'The expression to rank by (e.g., [Total Revenue]).' },
      { name: 'value', description: 'Optional. The value to find the rank for. Defaults to the current expression value.' },
      { name: 'order', description: 'Optional. 0 = descending (highest = rank 1), 1 = ascending (lowest = rank 1). Default is 0.' },
      { name: 'ties', description: 'Optional. "Dense" or "Skip". Dense: 1,2,2,3. Skip: 1,2,2,4. Default is Skip.' }
    ],
    examples: [
      { formula: 'RANKX( ALL( Dim_Product ), [Total Revenue] )', context: 'Rank each product by revenue (best = 1)', result: '1, 2, 3, ...' },
      { formula: 'RANKX( ALL( Dim_Store ), [Total Revenue], , 0, "Dense" )', context: 'Dense rank of stores by revenue', result: '1, 2, 2, 3, ...' }
    ],
    notes: 'Use ALL(Table) in the first parameter so that the ranking considers all items, not just those currently filtered. Without ALL, the rank will change as users apply filters, which may be confusing.',
    relatedFunctions: ['TOPN', 'ALL', 'CALCULATE']
  },

  'IF': {
    syntax: 'IF( <condition>, <valueIfTrue>, <valueIfFalse> )',
    description: 'Checks a condition and returns one value if TRUE, another if FALSE. The most basic conditional function. Use SWITCH for multiple conditions to avoid deeply nested IFs.',
    returnType: 'Varies (depends on return values)',
    parameters: [
      { name: 'condition', description: 'A logical test that evaluates to TRUE or FALSE.' },
      { name: 'valueIfTrue', description: 'Value returned when condition is TRUE.' },
      { name: 'valueIfFalse', description: 'Optional. Value returned when condition is FALSE. Defaults to BLANK.' }
    ],
    examples: [
      { formula: 'IF( [Profit Margin] > 0.2, "High", "Low" )', context: 'Categorize profit margins', result: '"High" or "Low"' },
      { formula: 'IF( ISBLANK( [Revenue] ), 0, [Revenue] )', context: 'Replace blank revenue with 0', result: 'Revenue value or 0' }
    ],
    notes: 'Avoid deeply nested IFs (IF within IF within IF). Use SWITCH instead for cleaner code. IF is evaluated in the current filter context, so [Profit Margin] respects any active slicers.',
    relatedFunctions: ['SWITCH', 'DIVIDE', 'ISBLANK', 'COALESCE']
  }

};
