import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Layout, List, Menu, Select } from 'antd';
import Sider from 'antd/es/layout/Sider';
import Title from 'antd/es/typography/Title';
import { Header } from 'antd/es/layout/layout';
import Meta from 'antd/es/card/Meta';
import type { MenuProps } from 'antd';
import CatalogMenu from './CatalogMenu';
import { getCategories, getProducts } from '../../services/customerRequests';
import { IProductQueryArgs } from '../../types/types';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import {
  addDataCatalog,
  addCurrentCategory,
  addSortCatalog,
  addDataAttributes,
} from '../../redux/slices/catalogSlice';
import './catalog.css';

const menuStyle: React.CSSProperties = {
  backgroundColor: '#f5f5f5',
  display: 'flex',
};

const searchKey = 'text.en-us';

function Catalog(): JSX.Element {
  const [categoriesData, setCategoriesData] = useState<MenuProps['items']>([]);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { dataProducts, settings } = useAppSelector((state) => state.catalog);

  const onClick: MenuProps['onClick'] = (e) => {
    dispatch(addCurrentCategory(e.key));
  };

  useEffect(() => {
    getCategories()
      .then((data) => {
        const categoriesArr: MenuProps['items'] = [];
        data.body.results.forEach((item) => {
          categoriesArr.push({
            label: item.name['en-US'],
            key: item.id,
          });
        });
        setCategoriesData(categoriesArr);
      })
      .catch(console.log);
  }, []);

  useEffect(() => {
    const queryParams: IProductQueryArgs = {
      priceCurrency: 'USD',
      filter: [
        `variants.scopedPrice.value.centAmount:range (${
          settings.price[0] * 100
        } to ${settings.price[1] * 100})`,
      ],
      // filter: 'variants.scopedPriceDiscounter:true',
    };
    if (settings.currentCategory) {
      queryParams.filter.push(`categories.id:"${settings.currentCategory}"`);
    }
    if (settings.sort) {
      queryParams.sort = settings.sort;
    }
    if (settings.search) {
      queryParams[searchKey] = settings.search;
    }
    settings.attributes.forEach((attr) => {
      if (attr === 'With picture') {
        queryParams.filter.push('variants.attributes.picture:true');
      } else {
        const key = attr.toLowerCase();
        queryParams.filter.push(`variants.attributes.color.key:"${key}"`);
      }
    });
    getProducts(queryParams)
      .then((data) => {
        dispatch(addDataCatalog(data.body.results));
      })
      .catch(console.log);
  }, [settings]);

  useEffect(() => {
    if (dataProducts.length) {
      const findAttributes = new Set<string>();
      dataProducts.forEach((item) => {
        item.variants[0].attributes?.forEach((attr) => {
          if (attr.name === 'picture' && attr.value) {
            findAttributes.add('With picture');
          } else if (attr.name === 'color') {
            findAttributes.add(
              attr.value.key.charAt(0).toUpperCase() + attr.value.key.slice(1),
            );
          }
        });
      });
      dispatch(addDataAttributes(Array.from(findAttributes)));
    }
  }, [dataProducts]);

  return (
    <Layout>
      <Header
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'transparent',
        }}
      >
        <Title level={2}>Catalog</Title>
      </Header>
      <Layout>
        <Sider style={{ background: 'transparent', padding: 14 }}>
          <CatalogMenu />
        </Sider>
        <Layout style={{ display: 'flex', gap: 10 }}>
          <Menu
            onClick={onClick}
            selectedKeys={[settings.currentCategory]}
            mode="horizontal"
            items={[...categoriesData!]}
            style={menuStyle}
          />
          <Select
            placeholder="Select a sorting option"
            value={settings.sort}
            onChange={(value) => dispatch(addSortCatalog(value))}
            style={{ width: 240 }}
            options={[
              {
                value: 'price asc',
                label: 'Sort by ascending prices',
              },
              {
                value: 'price desc',
                label: 'Sort by descending prices',
              },
              {
                value: 'name.en-us asc',
                label: 'Sort by ascending names',
              },
              {
                value: 'name.en-us desc',
                label: 'Sort by descending names',
              },
            ]}
          />
          <List
            grid={{
              gutter: 16,
              xs: 1,
              sm: 1,
              md: 2,
              lg: 3,
              xl: 4,
              xxl: 4,
            }}
            dataSource={dataProducts}
            renderItem={(item) => (
              <List.Item>
                <Card
                  hoverable
                  style={{ width: 240 }}
                  cover={
                    <img
                      alt="example"
                      src={item.masterVariant!.images![0].url}
                    />
                  }
                  onClick={() => navigate(item.id!)}
                >
                  <Meta
                    title={item.name['en-US']}
                    description={item.description!['en-US']}
                  />
                  <div className="price-wrapper">
                    {item.masterVariant.scopedPriceDiscounted && (
                      <div className="price">
                        {(
                          item.masterVariant.price!.discounted!.value
                            .centAmount / 100
                        ).toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        })}
                      </div>
                    )}
                    <div
                      className={
                        item.masterVariant.scopedPriceDiscounted
                          ? 'price-old'
                          : 'price'
                      }
                    >
                      {(
                        item.masterVariant.price!.value.centAmount / 100
                      ).toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      })}
                    </div>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        </Layout>
      </Layout>
    </Layout>
  );
}

export default Catalog;
