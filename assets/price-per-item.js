if (!customElements.get('price-per-item')) {
  customElements.define(
    'price-per-item',
    class PricePerItem extends HTMLElement {
      constructor() {
        super();
        this.variantId = this.dataset.variantId;
        this.input = document.getElementById(`Quantity-${this.dataset.sectionId || this.dataset.variantId}`);
        if (this.input) {
          this.inputChangeHandler = this.onInputChange.bind(this);
          this.input.addEventListener('change', this.inputChangeHandler);
        }

        this.getVolumePricingArray();
      }

      connectedCallback() {
        this.onCartChangeHandler = this.onCartChange.bind(this);
        document.addEventListener('afterCartChanged', this.onCartChangeHandler);
        document.addEventListener('afterUpdateQuantity', this.onCartChangeHandler);
      }

      disconnectedCallback() {
        if (this.onCartChangeHandler) {
          document.removeEventListener('afterCartChanged', this.onCartChangeHandler);
          document.removeEventListener('afterUpdateQuantity', this.onCartChangeHandler);
        }
        if (this.input) {
          this.input.removeEventListener('change', this.inputChangeHandler);
        }
      }

      onInputChange() {
        this.updatePricePerItem();
      }

      onCartChange(event) {
        const response = event.detail;
        if (!response.cartData) return;

        // Item was added to cart via product page
        if (response.cartData['variant_id'] !== undefined) {
          if (response.productVariantId === this.variantId) this.updatePricePerItem(response.cartData.quantity);
          // Qty was updated in cart
        } else if (response.cartData.item_count !== 0) {
          const isVariant = response.cartData.items.find((item) => item.variant_id.toString() === this.variantId);
          if (isVariant && isVariant.id.toString() === this.variantId) {
            // The variant is still in cart
            this.updatePricePerItem(isVariant.quantity);
          } else {
            // The variant was removed from cart, qty is 0
            this.updatePricePerItem(0);
          }
          // All items were removed from cart
        } else {
          this.updatePricePerItem(0);
        }
      }

      updatePricePerItem(updatedCartQuantity) {
        if (this.input) {
          this.enteredQty = parseInt(this.input.value);
          this.step = parseInt(this.input.step)
        }

        // updatedCartQuantity is undefined when qty is updated on product page. We need to sum entered qty and current qty in cart.
        // updatedCartQuantity is not undefined when qty is updated in cart. We need to sum qty in cart and min qty for product.
        this.currentQtyForVolumePricing = updatedCartQuantity === undefined ? this.getCartQuantity(updatedCartQuantity) + this.enteredQty : this.getCartQuantity(updatedCartQuantity) + parseInt(this.step);

        if (this.classList.contains('variant-item__price-per-item')) {
          this.currentQtyForVolumePricing = this.getCartQuantity(updatedCartQuantity);
        }
        for (let pair of this.qtyPricePairs) {
          if (this.currentQtyForVolumePricing >= pair[0]) {
            const pricePerItemsCurrent = document.querySelectorAll(`.price-per-item-wrapper[id^="Price-Per-Item-${this.dataset.sectionId || this.dataset.variantId}"] .price-per-item span`);
            pricePerItemsCurrent.forEach(pricePerItemCurrent => {
              this.classList.contains('variant-item__price-per-item') ? pricePerItemCurrent.innerHTML = window.quickOrderListStrings.each.replace('[money]', pair[1]) : pricePerItemCurrent.innerHTML = pair[1];
            });
            break;
          }
        }
      }

      getCartQuantity(updatedCartQuantity) {
        return (updatedCartQuantity || updatedCartQuantity === 0) ? updatedCartQuantity : parseInt(this.input.dataset.cartQuantity);
      }

      getVolumePricingArray() {
        const volumePricing = document.getElementById(`Volume-${this.dataset.sectionId || this.dataset.variantId}`);
        this.qtyPricePairs = [];

        if (volumePricing) {
          volumePricing.querySelectorAll('li').forEach(li => {
            const qty = parseInt(li.querySelector('span:first-child').textContent);
            const price = (li.querySelector('span:not(:first-child):last-child').dataset.text);
            this.qtyPricePairs.push([qty, price]);
          });
        }
        this.qtyPricePairs.reverse();
      }
    }
  );
}