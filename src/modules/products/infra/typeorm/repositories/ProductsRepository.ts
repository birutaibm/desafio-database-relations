import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({ name, price, quantity });
    return this.ormRepository.save(product);
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({
      where: { name },
    });
    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const foundProducts = await this.ormRepository.findByIds(
      products.map(({ id }) => id),
    );
    return foundProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const mappedProducts = products.reduce((mapped, product) => {
      const key = product.id;
      const value = product.quantity;
      return { ...mapped, [key]: value };
    }, {} as { [key: string]: number });
    const foundProducts = await this.ormRepository.findByIds(
      Object.keys(mappedProducts),
    );
    const updatedProducts = foundProducts.map(product => ({
      ...product,
      quantity: mappedProducts[product.id],
    }));
    return this.ormRepository.save(updatedProducts);
  }
}

export default ProductsRepository;
