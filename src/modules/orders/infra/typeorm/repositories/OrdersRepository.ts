import { getRepository, Repository } from 'typeorm';

import IOrdersRepository from '@modules/orders/repositories/IOrdersRepository';
import ICreateOrderDTO from '@modules/orders/dtos/ICreateOrderDTO';
import Order from '../entities/Order';
import OrdersProducts from '../entities/OrdersProducts';

class OrdersRepository implements IOrdersRepository {
  private ormRepository: Repository<Order>;

  constructor() {
    this.ormRepository = getRepository(Order);
  }

  public async create({ customer, products }: ICreateOrderDTO): Promise<Order> {
    const order = this.ormRepository.create({
      customer,
    });
    await this.ormRepository.save(order);

    const itemsRepo = getRepository(OrdersProducts);
    const items = products.map(product =>
      itemsRepo.create({
        ...product,
        order,
      }),
    );
    await itemsRepo.save(items);

    order.order_products = items;
    return order;
  }

  public async findById(id: string): Promise<Order | undefined> {
    return this.ormRepository.findOne(id, {
      relations: ['customer', 'order_products', 'order_products.product'],
    });
  }
}

export default OrdersRepository;
