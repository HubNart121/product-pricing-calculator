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
    btnSaveImage.addEventListener('click', () => {
        btnSaveImage.disabled = true;
        btnSaveImage.innerHTML = `
            <svg class="spinner" viewBox="0 0 50 50" style="width: 20px; height: 20px; animation: rotate 2s linear infinite;"><circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5" stroke="#fff" style="animation: dash 1.5s ease-in-out infinite;"/></svg>
            กำลังบันทึก...
        `;

        // Wait a frame so UI updates
        setTimeout(() => {
            // Temporarily adjust styles for perfect export
            const originalBoxShadow = exportSection.style.boxShadow;
            const originalTransform = exportSection.style.transform;
            const originalMargin = exportSection.style.margin;
            const originalBackground = exportSection.style.background;
            
            exportSection.style.boxShadow = 'none';
            exportSection.style.transform = 'none';
            exportSection.style.margin = '0'; // prevent weird offsets
            
            // Fix html2canvas bug crashing on linear-gradient with CSS vars
            exportSection.style.background = '#1e293b'; 

            let pName = productName.value.trim() || 'Pricing_Summary';
            pName = pName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

            html2canvas(exportSection, {
                scale: 2, // Higher resolution
                backgroundColor: '#0f172a',
                logging: false,
                useCORS: true
            }).then(canvas => {
                // Restore styles
                exportSection.style.boxShadow = originalBoxShadow;
                exportSection.style.transform = originalTransform;
                exportSection.style.margin = originalMargin;
                exportSection.style.background = originalBackground;

                // Generate Image Link
                const link = document.createElement('a');
                link.download = `${pName}_calculator.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                
                // Restore Button
                btnSaveImage.disabled = false;
                btnSaveImage.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                    บันทึกเป็นรูปภาพ (Save as Image)
                `;
            }).catch(err => {
                console.error('Error generating image:', err);
                alert('เกิดข้อผิดพลาด: ' + err.message + ' (ลองใหม่อีกครั้ง)');
                
                // Restore styles on error
                exportSection.style.boxShadow = originalBoxShadow;
                exportSection.style.transform = originalTransform;
                exportSection.style.margin = originalMargin;
                exportSection.style.background = originalBackground;

                btnSaveImage.disabled = false;
                btnSaveImage.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                    บันทึกเป็นรูปภาพ (Save as Image)
                `;
            });
        }, 100);
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
