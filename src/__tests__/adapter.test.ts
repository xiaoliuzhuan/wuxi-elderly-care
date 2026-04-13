import nock from 'nock';
import { ZhiQueCmsAdapter } from '../adapter/ZhiQueCmsAdapter';

describe('ZhiQueCmsAdapter meal point filtering', () => {
  const baseUrl = 'https://business.myxbx.com';

  beforeEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    nock.cleanAll();
  });

  it('should infer Xinwu district from Wangzhuang street when district text is missing in address', async () => {
    nock(baseUrl)
      .post('/hm/api/foreign-api/foodsite/list')
      .reply(200, {
        code: '1000',
        data: [
          {
            id: 1,
            name: '旺庄街道助餐中心',
            address: '春丰路2号(旺庄街道乐享颐养中心)',
            telephone: '85290886',
          },
          {
            id: 2,
            name: '新安街道第五社区助餐点',
            address: '新吴区新安街道新安花苑第五社区30号',
            telephone: '15061793072',
          },
        ],
      });

    const adapter = new ZhiQueCmsAdapter();
    const result = await adapter.getMealPoints('新吴区');

    expect(result.points).toHaveLength(2);
    expect(result.points.map((item) => item.name)).toContain('旺庄街道助餐中心');
    expect(result.points.find((item) => item.name === '旺庄街道助餐中心')?.district).toBe('新吴区');
  });

  it('should match district + street together after structured inference', async () => {
    nock(baseUrl)
      .post('/hm/api/foreign-api/foodsite/list')
      .reply(200, {
        code: '1000',
        data: [
          {
            id: 1,
            name: '旺庄街道助餐中心',
            address: '春丰路2号(旺庄街道乐享颐养中心)',
            telephone: '85290886',
          },
        ],
      });

    const adapter = new ZhiQueCmsAdapter();
    const result = await adapter.getMealPoints('新吴区', '旺庄街道');

    expect(result.points).toHaveLength(1);
    expect(result.points[0].name).toBe('旺庄街道助餐中心');
  });
});
