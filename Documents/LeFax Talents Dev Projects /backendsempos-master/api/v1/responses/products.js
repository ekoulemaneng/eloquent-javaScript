exports.getInfosProductsForCatalog = (products) => {
    return {
        status: 200,
        details: {
            items: products,
            count: products.length
        }
    }
}

exports.InvalidOperation = {
    status: 400,
    details: {
        code: 'InvalidOperation',
        message: 'This operation is invalid.'
    }
}