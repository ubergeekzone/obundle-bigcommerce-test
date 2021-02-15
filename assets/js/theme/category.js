import { hooks } from '@bigcommerce/stencil-utils';
import CatalogPage from './catalog';
import compareProducts from './global/compare-products';
import FacetedSearch from './common/faceted-search';
import { createTranslationDictionary } from '../theme/common/utils/translations-utils';

export default class Category extends CatalogPage {
    constructor(context) {
        super(context);
        this.validationDictionary = createTranslationDictionary(context);
    }

    setLiveRegionAttributes($element, roleType, ariaLiveStatus) {
        $element.attr({
            role: roleType,
            'aria-live': ariaLiveStatus,
        });
    }

    makeShopByPriceFilterAccessible() {
        if (!$('[data-shop-by-price]').length) return;

        if ($('.navList-action').hasClass('is-active')) {
            $('a.navList-action.is-active').focus();
        }

        $('a.navList-action').on('click', () => this.setLiveRegionAttributes($('span.price-filter-message'), 'status', 'assertive'));
    }

    onReady() {
        this.arrangeFocusOnSortBy();

        $('[data-button-type="add-cart"]').on('click', (e) => this.setLiveRegionAttributes($(e.currentTarget).next(), 'status', 'polite'));

        this.makeShopByPriceFilterAccessible();

        compareProducts(this.context.urls);

        if ($('#facetedSearch').length > 0) {
            this.initFacetedSearch();
        } else {
            this.onSortBySubmit = this.onSortBySubmit.bind(this);
            hooks.on('sortBy-submitted', this.onSortBySubmit);
        }

        $('a.reset-btn').on('click', () => this.setLiveRegionsAttributes($('span.reset-message'), 'status', 'polite'));

        this.ariaNotifyNoProducts();

        $( ".card-figure" ).hover(
          function() {
            var image = $(this).find('.card-image');
            image.addClass("replaced").hide();
            var altImage =  $('<img />', {
              src:  image.attr('data-hoverimage'),
              class: "altImage card-image lazyautosizes lazyloaded"
            });
            $(this).find(".card-figure__link .card-img-container").prepend(altImage);
          }, function() {
            $(this).find(".card-figure__link .card-img-container .altImage").remove();
            $(this).find(".card-figure__link .card-img-container .replaced").removeClass("replaced").show();
          }
        );

          $.ajax({
          "async": true,
          "crossDomain": true,
          "url": "https://obundle-test64.mybigcommerce.com/api/storefront/carts?include=lineItems.digitalItems.options%2ClineItems.physicalItems.options",
          "method": "GET",
          "headers": {}
          }).done(function (response) {
              if(response.length > 0) {
                  $(".removeAllFromCart").show();
                  var cartID = response[0].id;
                  if(response[0].lineItems.physicalItems.length > 0) {
                      $.each(response[0].lineItems.physicalItems, function(index, item) {
                          $("body").on("click", ".removeAllFromCart", function(e) {
                            e.preventDefault();
                            $.ajax({
                                "async": true,
                                "crossDomain": true,
                                "url": "https://api.bigcommerce.com/stores/vlgbx5fu73/v3/carts/"+cartID+"/items/112",
                                "method": "DELETE",
                                "headers": {
                                  "accept": "application/json",
                                  "content-type": "application/json",
                                  "x-auth-token": "46vady0aij8d3vnnj87izfpifhy5xjp"
                                },
                                "processData": false
                              }).done(function (response) {

                              });
                          });
                      });
                  }
              } else {
                $(".removeAllFromCart").hide();
              }
          });

          $(".addAllToCart").click(function(e) {
              e.preventDefault();
              $.get("/cart.php?action=add&product_id=112", function(data) {
                  $(".removeAllFromCart").show();
              });
          });

          $("body").on("click", ".goToCartBtn", function(e) {
            e.preventDefault();
            window.location = "/cart.php"
          });

          $("body").on("click", ".removeAllFromCartModalClose", function(e) {
            $("#removeAllFromCartModal, .modal-background").hide();
          });

    }

    ariaNotifyNoProducts() {
        const $noProductsMessage = $('[data-no-products-notification]');
        if ($noProductsMessage.length) {
            $noProductsMessage.focus();
        }
    }

    initFacetedSearch() {
        const {
            price_min_evaluation: onMinPriceError,
            price_max_evaluation: onMaxPriceError,
            price_min_not_entered: minPriceNotEntered,
            price_max_not_entered: maxPriceNotEntered,
            price_invalid_value: onInvalidPrice,
        } = this.validationDictionary;
        const $productListingContainer = $('#product-listing-container');
        const $facetedSearchContainer = $('#faceted-search-container');
        const productsPerPage = this.context.categoryProductsPerPage;
        const requestOptions = {
            config: {
                category: {
                    shop_by_price: true,
                    products: {
                        limit: productsPerPage,
                    },
                },
            },
            template: {
                productListing: 'category/product-listing',
                sidebar: 'category/sidebar',
            },
            showMore: 'category/show-more',
        };

        this.facetedSearch = new FacetedSearch(requestOptions, (content) => {
            $productListingContainer.html(content.productListing);
            $facetedSearchContainer.html(content.sidebar);

            $('body').triggerHandler('compareReset');

            $('html, body').animate({
                scrollTop: 0,
            }, 100);
        }, {
            validationErrorMessages: {
                onMinPriceError,
                onMaxPriceError,
                minPriceNotEntered,
                maxPriceNotEntered,
                onInvalidPrice,
            },
        });
    }
}
