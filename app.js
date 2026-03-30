document.addEventListener('DOMContentLoaded', () => {

    // --- Selectors ---
    const inputs = {
        exw: document.getElementById('exw-price'),
        exc: document.getElementById('exc-rate'),
        qty: document.getElementById('quantity'),
        sea: document.getElementById('sea-cost'),
        dom: document.getElementById('domestic-cost'),
        margin: document.getElementById('gp-margin'),
    };

    const outputs = {
        basePrice: document.getElementById('display-base-price'),
        seaShip: document.getElementById('res-sea-ship'),
        domestic: document.getElementById('res-domestic'),
        totalCost: document.getElementById('res-total-cost'),
        unitPrice: document.getElementById('res-unit-price'),
        grandTotal: document.getElementById('res-grand-total'),
        totalProfit: document.getElementById('res-total-profit')
    };

    const btnSaveImage = document.getElementById('btn-save-image');
    const exportSection = document.getElementById('export-section');
    const productName = document.getElementById('product-name');

    // --- Currency Formatter ---
    const formatCurrency = (value, prefix = '฿') => {
        return prefix + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    };

    // --- Calculation Logic ---
    const calculatePricing = () => {
        // 1. Get Values
        const exw = parseFloat(inputs.exw.value) || 0;
        const exc = parseFloat(inputs.exc.value) || 0;
        const qty = parseFloat(inputs.qty.value) || 1;
        
        const seaPercent = (parseFloat(inputs.sea.value) || 0) / 100;
        const domPercent = (parseFloat(inputs.dom.value) || 0) / 100;
        const marginPercent = (parseFloat(inputs.margin.value) || 0) / 100;

        // 2. Base Price
        const basePrice = exw * exc * qty;

        // 3. Subtotal (After Sea Freight) - Reverse Margin Logic
        // Formula used in image: Sea Ship = 40% of (Base Price + Sea Ship) -> Subtotal = Base / (1 - 0.4)
        let subtotalSea = basePrice;
        if (seaPercent < 1) {
            subtotalSea = basePrice / (1 - seaPercent);
        }
        const seaShipCost = subtotalSea - basePrice;

        // 4. Total Cost (After Domestic) - Reverse Margin Logic
        // Formula: Domestic = 3% of Total Cost -> Total Cost = Subtotal / (1 - 0.03)
        let totalCost = subtotalSea;
        if (domPercent < 1) {
            totalCost = subtotalSea / (1 - domPercent);
        }
        const domesticCost = totalCost - subtotalSea;

        // 5. Grand Total (Sell Price) & Profit
        let grandTotal = totalCost;
        if (marginPercent < 1) {
            grandTotal = totalCost / (1 - marginPercent);
        }
        const totalProfit = grandTotal - totalCost;
        const unitPrice = qty > 0 ? (grandTotal / qty) : 0;

        // 6. Update UI
        outputs.basePrice.textContent = formatCurrency(Math.round(basePrice));
        outputs.seaShip.textContent = formatCurrency(Math.round(seaShipCost));
        outputs.domestic.textContent = formatCurrency(Math.round(domesticCost));
        outputs.totalCost.textContent = formatCurrency(Math.round(totalCost));
        
        outputs.unitPrice.textContent = formatCurrency(Math.round(unitPrice));
        outputs.grandTotal.textContent = formatCurrency(Math.round(grandTotal));
        outputs.totalProfit.textContent = formatCurrency(Math.round(totalProfit));
    };

    // --- Attach Event Listeners ---
    Object.values(inputs).forEach(input => {
        input.addEventListener('input', calculatePricing);
    });

    // Initial Calculation
    calculatePricing();

    // --- Export functionality (html2canvas) ---
    const saveBtnDefaultHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
        บันทึกเป็นรูปภาพ (Save as Image)
    `;

    const restoreButton = () => {
        btnSaveImage.disabled = false;
        btnSaveImage.innerHTML = saveBtnDefaultHTML;
    };

    btnSaveImage.addEventListener('click', () => {
        btnSaveImage.disabled = true;
        btnSaveImage.innerHTML = `
            <svg class="spinner" viewBox="0 0 50 50" style="width: 20px; height: 20px; animation: rotate 2s linear infinite;"><circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5" stroke="#fff" style="animation: dash 1.5s ease-in-out infinite;"/></svg>
            กำลังบันทึก...
        `;

        let pName = productName.value.trim() || 'Pricing_Summary';
        pName = pName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        // Wait a frame for button UI to update
        setTimeout(() => {
            const appContainer = document.getElementById('calculator-app');

            html2canvas(appContainer, {
                scale: 2,
                backgroundColor: '#0f172a',
                logging: false,
                useCORS: true,
                // Key fix: sanitize the cloned DOM before html2canvas parses CSS
                onclone: (clonedDoc, clonedElement) => {
                    // 1. Inject CSS overrides that replace all oklch / linear-gradient / CSS vars
                    //    with simple hex colors html2canvas can understand
                    const fixStyle = clonedDoc.createElement('style');
                    fixStyle.textContent = `
                        /* Force color-scheme to prevent browser oklch injection */
                        :root, html, body, *, *::before, *::after {
                            color-scheme: normal !important;
                            forced-color-adjust: none !important;
                        }
                        /* Re-declare all CSS variables as explicit hex */
                        :root {
                            --bg-dark: #0f172a !important;
                            --bg-card: #1e293b !important;
                            --bg-input: #0f172a !important;
                            --text-main: #f8fafc !important;
                            --text-muted: #94a3b8 !important;
                            --accent-primary: #3b82f6 !important;
                            --accent-hover: #2563eb !important;
                            --color-orange: #f97316 !important;
                            --color-green: #22c55e !important;
                            --color-yellow: #eab308 !important;
                            --border-color: #334155 !important;
                            --border-highlight: #3b82f6 !important;
                        }
                        /* Replace all gradients with solid fallback colors */
                        .summary-card {
                            background: #1a2744 !important;
                        }
                        .summary-card .card-header {
                            background-color: rgba(59, 130, 246, 0.1) !important;
                            background: rgba(59, 130, 246, 0.1) !important;
                        }
                        .grand-total {
                            background: #172033 !important;
                        }
                        .app-header {
                            background: #1e293b !important;
                        }
                        /* Hide action bar & sticky header offset in exported image */
                        .action-bar {
                            display: none !important;
                        }
                        .app-container {
                            padding-bottom: 20px !important;
                        }
                        .app-header {
                            position: relative !important;
                        }
                        /* Force inputs to show their values clearly */
                        input, textarea {
                            color: #f8fafc !important;
                            background-color: #0f172a !important;
                            border-color: #334155 !important;
                        }
                        .highlight-input input {
                            color: #eab308 !important;
                            background-color: rgba(234, 179, 8, 0.05) !important;
                            border-color: rgba(234, 179, 8, 0.3) !important;
                        }
                        .highlight-margin input {
                            color: #22c55e !important;
                            background-color: rgba(34, 197, 94, 0.05) !important;
                            border-color: rgba(34, 197, 94, 0.3) !important;
                        }
                    `;
                    clonedDoc.head.appendChild(fixStyle);

                    // 2. Force inline styles on the cloned element
                    clonedElement.style.boxShadow = 'none';
                    clonedElement.style.transform = 'none';
                }
            }).then(canvas => {
                const link = document.createElement('a');
                link.download = `${pName}_calculator.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                restoreButton();
            }).catch(err => {
                console.error('Error generating image:', err);
                alert('เกิดข้อผิดพลาด: ' + err.message);
                restoreButton();
            });
        }, 150);
    });

    // Simple animation styles injection for spinner
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes rotate { 100% { transform: rotate(360deg); } }
        @keyframes dash {
            0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
            50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
            100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
        }
    `;
    document.head.appendChild(style);
});
