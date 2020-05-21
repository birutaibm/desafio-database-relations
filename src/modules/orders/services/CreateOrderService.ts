import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateProductService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);
    if (!customer) {
      throw new AppError('Customer not found');
    }

    const knownProducts = await this.productsRepository.findAllById(products);
    if (products.length !== knownProducts.length) {
      throw new AppError('Invalid product was found');
    }
    const updatedProducts: IUpdateProductsQuantityDTO[] = [];

    const orderProducts = knownProducts.map(product => {
      const quantity = products.find(({ id }) => product.id === id)?.quantity;
      if (quantity === undefined) {
        throw new AppError('Fail to get product quantity');
      }
      if (product.quantity < quantity) {
        throw new AppError('Insufficient quantity of product');
      }

      updatedProducts.push({
        id: product.id,
        quantity: product.quantity - quantity,
      });

      return {
        product_id: product.id,
        quantity,
        price: product.price,
      };
    });

    this.productsRepository.updateQuantity(updatedProducts);
    const order = await this.ordersRepository.create({
      customer,
      products: orderProducts,
    });

    return order;
  }
}

export default CreateProductService;
