import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);


export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const getProduct = async (productId: number) => {
    return api.get<Product>(`products/${productId}`)
      .then(res => {
        return res.data
      })
      .catch(err => {
        toast.error('Erro ao carregar o produto');
        return null
      })
  }

  const addProduct = async (productId: number) => {
    try {

      api.get<Stock>(`/stock/${productId}`)
        .then(res => {
          if (res.data.amount > 0) {
            const productIndex = cart.findIndex(product => product.id === productId);

            if (productIndex >= 0 && res.data.amount > cart[productIndex].amount) {
              cart[productIndex].amount++;
              setCart([...cart])
              localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))

            } else if (productIndex === -1) {
              getProduct(productId)
                .then(product => {
                  
                  if (product && res.data.amount >= 1) {
                    product.amount = 1;
                    setCart([...cart, product])
                    localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, product]))
                  } else {
                    toast.error('Erro na adição do produto')
                  }
                })
                .catch(err => toast.error('Erro na adição do produto'))

            } else {
              toast.error('Quantidade solicitada fora de estoque');
            }


          } else {
            toast.error('Quantidade solicitada fora de estoque');
          }
        })
        .catch(err => toast.error('Erro na adição do produto'))

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productIndex = cart.findIndex(product => product.id === productId);

      if (productIndex >= 0) {
        cart.splice(productIndex, 1);
        setCart([...cart])
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
      } else {
        toast.error('Erro na remoção do produto');
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({ productId, amount }: UpdateProductAmount) => {
    try {

      const productIndex = cart.findIndex(product => product.id === productId);

      if (amount <= 0)
        return;

      api.get<Stock>(`/stock/${productId}`)
        .then(res => {

          if (res.data.amount >= amount) {
            cart[productIndex].amount = amount;
            setCart([...cart])
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
          } else {
            toast.error('Quantidade solicitada fora de estoque');
          }

        })
        .catch(err => toast.error('Erro na alteração de quantidade do produto'));

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
