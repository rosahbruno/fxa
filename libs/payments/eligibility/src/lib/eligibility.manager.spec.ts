/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Test, TestingModule } from '@nestjs/testing';

import {
  StripeManager,
  StripePlan,
  StripePlanFactory,
} from '@fxa/payments/stripe';
import {
  ContentfulManager,
  EligibilityContentByOfferingResultUtil,
  EligibilityContentByPlanIdsResultUtil,
  EligibilityContentOfferingResultFactory,
  EligibilityContentSubgroupOfferingResultFactory,
  EligibilityContentSubgroupResultFactory,
  EligibilityOfferingResultFactory,
  EligibilitySubgroupOfferingResultFactory,
  EligibilitySubgroupResultFactory,
} from '@fxa/shared/contentful';
import { CartEligibilityStatus, CartState } from '@fxa/shared/db/mysql/account';

import { EligibilityManager } from './eligibility.manager';
import { OfferingComparison, OfferingOverlapResult } from './eligibility.types';

describe('EligibilityManager', () => {
  let manager: EligibilityManager;
  let mockContentfulManager: ContentfulManager;
  let mockOfferingResult: EligibilityContentByOfferingResultUtil;
  let mockResult: EligibilityContentByPlanIdsResultUtil;
  let mockStripeManager: StripeManager;

  beforeEach(async () => {
    mockOfferingResult = {} as EligibilityContentByOfferingResultUtil;
    mockResult = {} as EligibilityContentByPlanIdsResultUtil;
    mockContentfulManager = {
      getEligibilityContentByOffering: jest
        .fn()
        .mockResolvedValueOnce(mockOfferingResult),
      getPurchaseDetailsForEligibility: jest
        .fn()
        .mockResolvedValueOnce(mockResult),
    } as any;
    mockStripeManager = {
      getPlanByInterval: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: ContentfulManager, useValue: mockContentfulManager },
        { provide: StripeManager, useValue: mockStripeManager },
        EligibilityManager,
      ],
    }).compile();

    manager = module.get<EligibilityManager>(EligibilityManager);
  });

  describe('getOfferingOverlap', () => {
    it('should return empty result', async () => {
      mockResult.offeringForPlanId = jest.fn().mockReturnValueOnce(undefined);
      const result = await manager.getOfferingOverlap(['test'], [], 'test');
      expect(result.length).toBe(0);
    });

    it('should return same offeringStripeProductIds as same comparison', async () => {
      const offeringResult = EligibilityOfferingResultFactory({
        stripeProductId: 'prod_test',
      });
      mockResult.offeringForPlanId = jest
        .fn()
        .mockReturnValueOnce(offeringResult);
      const result = await manager.getOfferingOverlap(
        [],
        ['prod_test'],
        'test'
      );
      expect(result.length).toBe(1);
      expect(result[0].comparison).toBe(OfferingComparison.SAME);
    });

    it('should return subgroup upgrade target offeringStripeProductIds as upgrade comparison', async () => {
      const offeringResult = EligibilityOfferingResultFactory({
        stripeProductId: 'prod_test3',
        linkedFrom: {
          subGroupCollection: {
            items: [
              EligibilitySubgroupResultFactory({
                offeringCollection: {
                  items: [
                    EligibilitySubgroupOfferingResultFactory({
                      stripeProductId: 'prod_test',
                      countries: ['usa'],
                    }),
                    EligibilitySubgroupOfferingResultFactory({
                      stripeProductId: 'prod_test2',
                      countries: ['usa'],
                    }),
                    EligibilitySubgroupOfferingResultFactory({
                      stripeProductId: 'prod_test3',
                      countries: ['usa'],
                    }),
                  ],
                },
              }),
            ],
          },
        },
      });
      mockResult.offeringForPlanId = jest
        .fn()
        .mockReturnValueOnce(offeringResult);
      const result = await manager.getOfferingOverlap(
        [],
        ['prod_test'],
        'test'
      );
      expect(result.length).toBe(1);
      expect(result[0].comparison).toBe(OfferingComparison.UPGRADE);
    });

    it('should return subgroup downgrade target offeringStripeProductIds as downgrade comparison', async () => {
      const offeringResult = EligibilityOfferingResultFactory({
        stripeProductId: 'prod_test',
        linkedFrom: {
          subGroupCollection: {
            items: [
              EligibilitySubgroupResultFactory({
                offeringCollection: {
                  items: [
                    EligibilitySubgroupOfferingResultFactory({
                      stripeProductId: 'prod_test',
                      countries: ['usa'],
                    }),
                    EligibilitySubgroupOfferingResultFactory({
                      stripeProductId: 'prod_test2',
                      countries: ['usa'],
                    }),
                  ],
                },
              }),
            ],
          },
        },
      });
      mockResult.offeringForPlanId = jest
        .fn()
        .mockReturnValueOnce(offeringResult);
      const result = await manager.getOfferingOverlap(
        [],
        ['prod_test2'],
        'test'
      );
      expect(result.length).toBe(1);
      expect(result[0].comparison).toBe(OfferingComparison.DOWNGRADE);
    });

    it('should return same comparison for same planId', async () => {
      const offeringResult = EligibilityOfferingResultFactory({
        stripeProductId: 'prod_test',
      });
      const existingResult = EligibilityOfferingResultFactory({
        stripeProductId: 'prod_test',
      });
      mockResult.offeringForPlanId = jest
        .fn()
        .mockReturnValueOnce(offeringResult)
        .mockReturnValueOnce(existingResult);
      const result = await manager.getOfferingOverlap(
        ['plan_test'],
        [],
        'plan_test'
      );
      expect(result.length).toBe(1);
      expect(result[0].comparison).toBe(OfferingComparison.SAME);
    });

    it('should return upgrade comparison for upgrade planId', async () => {
      const offeringResult = EligibilityOfferingResultFactory({
        stripeProductId: 'prod_test2',
        linkedFrom: {
          subGroupCollection: {
            items: [
              EligibilitySubgroupResultFactory({
                offeringCollection: {
                  items: [
                    EligibilitySubgroupOfferingResultFactory({
                      stripeProductId: 'prod_test',
                      countries: ['usa'],
                    }),
                    EligibilitySubgroupOfferingResultFactory({
                      stripeProductId: 'prod_test2',
                      countries: ['usa'],
                    }),
                  ],
                },
              }),
            ],
          },
        },
      });
      const existingResult = EligibilityOfferingResultFactory({
        stripeProductId: 'prod_test',
      });
      mockResult.offeringForPlanId = jest
        .fn()
        .mockReturnValueOnce(offeringResult)
        .mockReturnValueOnce(existingResult);
      const result = await manager.getOfferingOverlap(
        ['plan_test'],
        [],
        'plan_test'
      );
      expect(result.length).toBe(1);
      expect(result[0].comparison).toBe(OfferingComparison.UPGRADE);
    });

    it('should return multiple comparisons in multiple subgroups', async () => {
      const offeringResult = EligibilityOfferingResultFactory({
        stripeProductId: 'prod_test2',
        linkedFrom: {
          subGroupCollection: {
            items: [
              EligibilitySubgroupResultFactory({
                offeringCollection: {
                  items: [
                    EligibilitySubgroupOfferingResultFactory({
                      stripeProductId: 'prod_test',
                      countries: ['usa'],
                    }),
                    EligibilitySubgroupOfferingResultFactory({
                      stripeProductId: 'prod_test2',
                      countries: ['usa'],
                    }),
                    EligibilitySubgroupOfferingResultFactory({
                      stripeProductId: 'prod_test3',
                      countries: ['usa'],
                    }),
                  ],
                },
              }),
              EligibilitySubgroupResultFactory({
                offeringCollection: {
                  items: [
                    EligibilitySubgroupOfferingResultFactory({
                      stripeProductId: 'prod_test',
                      countries: ['usa'],
                    }),
                    EligibilitySubgroupOfferingResultFactory({
                      stripeProductId: 'prod_test2',
                      countries: ['usa'],
                    }),
                  ],
                },
              }),
            ],
          },
        },
      });
      const existingResult = EligibilityOfferingResultFactory({
        stripeProductId: 'prod_test',
      });
      mockResult.offeringForPlanId = jest
        .fn()
        .mockReturnValueOnce(offeringResult)
        .mockReturnValueOnce(existingResult);
      const result = await manager.getOfferingOverlap(
        ['plan_test'],
        ['prod_test3'],
        'plan_test'
      );
      expect(result.length).toBe(2);
      expect(result[0]).toEqual({
        comparison: OfferingComparison.DOWNGRADE,
        offeringProductId: 'prod_test3',
        type: 'offering',
      });
      expect(result[1]).toEqual({
        comparison: OfferingComparison.UPGRADE,
        planId: 'plan_test',
        type: 'plan',
      });
    });
  });

  describe('getProductIdOverlap', () => {
    it('should return empty result', async () => {
      const mockTargetOffering = EligibilityContentOfferingResultFactory();
      mockOfferingResult.getOffering = jest.fn().mockReturnValueOnce(undefined);

      const result = await manager.getProductIdOverlap([], mockTargetOffering);
      expect(result.length).toBe(0);

      const result2 = await manager.getProductIdOverlap(
        ['test'],
        mockTargetOffering
      );
      expect(result2.length).toBe(0);
    });

    it('should return same offeringStripeProductIds as same comparison', async () => {
      const mockProductId = 'prod_test';
      const mockTargetOfferingResult = EligibilityContentOfferingResultFactory({
        stripeProductId: mockProductId,
      });

      mockOfferingResult.getOffering = jest
        .fn()
        .mockReturnValueOnce(mockTargetOfferingResult);

      const result = await manager.getProductIdOverlap(
        [mockProductId],
        mockTargetOfferingResult
      );
      expect(result.length).toBe(1);
      expect(result[0].comparison).toBe(OfferingComparison.SAME);
    });

    it('should return subgroup upgrade target offeringStripeProductIds as upgrade comparison', async () => {
      const mockTargetOfferingResult = EligibilityContentOfferingResultFactory({
        stripeProductId: 'prod_test3',
        linkedFrom: {
          subGroupCollection: {
            items: [
              EligibilityContentSubgroupResultFactory({
                offeringCollection: {
                  items: [
                    EligibilityContentSubgroupOfferingResultFactory({
                      stripeProductId: 'prod_test',
                    }),
                    EligibilityContentSubgroupOfferingResultFactory({
                      stripeProductId: 'prod_test2',
                    }),
                    EligibilityContentSubgroupOfferingResultFactory({
                      stripeProductId: 'prod_test3',
                    }),
                  ],
                },
              }),
            ],
          },
        },
      });

      mockOfferingResult.getOffering = jest
        .fn()
        .mockReturnValueOnce(mockTargetOfferingResult);
      const result = await manager.getProductIdOverlap(
        ['prod_test'],
        mockTargetOfferingResult
      );
      expect(result.length).toBe(1);
      expect(result[0].comparison).toBe(OfferingComparison.UPGRADE);
    });

    it('should return subgroup downgrade target offeringStripeProductIds as downgrade comparison', async () => {
      const mockTargetOfferingResult = EligibilityContentOfferingResultFactory({
        stripeProductId: 'prod_test',
        linkedFrom: {
          subGroupCollection: {
            items: [
              EligibilityContentSubgroupResultFactory({
                offeringCollection: {
                  items: [
                    EligibilityContentSubgroupOfferingResultFactory({
                      stripeProductId: 'prod_test',
                    }),
                    EligibilityContentSubgroupOfferingResultFactory({
                      stripeProductId: 'prod_test2',
                    }),
                  ],
                },
              }),
            ],
          },
        },
      });
      mockOfferingResult.getOffering = jest
        .fn()
        .mockReturnValueOnce(mockTargetOfferingResult);
      const result = await manager.getProductIdOverlap(
        ['prod_test2'],
        mockTargetOfferingResult
      );
      expect(result.length).toBe(1);
      expect(result[0].comparison).toBe(OfferingComparison.DOWNGRADE);
    });

    it('should return same comparison for same productId', async () => {
      const mockTargetOfferingResult = EligibilityContentOfferingResultFactory({
        stripeProductId: 'prod_test',
      });
      const existingResult = EligibilityContentOfferingResultFactory({
        stripeProductId: 'prod_test',
      });
      mockOfferingResult.getOffering = jest
        .fn()
        .mockReturnValueOnce(mockTargetOfferingResult)
        .mockReturnValueOnce(existingResult);
      const result = await manager.getProductIdOverlap(
        ['prod_test'],
        mockTargetOfferingResult
      );
      expect(result.length).toBe(1);
      expect(result[0].comparison).toBe(OfferingComparison.SAME);
    });

    it('should return upgrade comparison for upgrade planId', async () => {
      const mockTargetOfferingResult = EligibilityContentOfferingResultFactory({
        stripeProductId: 'prod_test2',
        linkedFrom: {
          subGroupCollection: {
            items: [
              EligibilityContentSubgroupResultFactory({
                offeringCollection: {
                  items: [
                    EligibilityContentSubgroupOfferingResultFactory({
                      stripeProductId: 'prod_test',
                    }),
                    EligibilityContentSubgroupOfferingResultFactory({
                      stripeProductId: 'prod_test2',
                    }),
                  ],
                },
              }),
            ],
          },
        },
      });
      const existingResult = EligibilityContentOfferingResultFactory({
        stripeProductId: 'prod_test',
      });
      mockOfferingResult.getOffering = jest
        .fn()
        .mockReturnValueOnce(mockTargetOfferingResult)
        .mockReturnValueOnce(existingResult);
      const result = await manager.getProductIdOverlap(
        ['prod_test'],
        mockTargetOfferingResult
      );
      expect(result.length).toBe(1);
      expect(result[0].comparison).toBe(OfferingComparison.UPGRADE);
    });

    it('should return multiple comparisons in multiple subgroups', async () => {
      const mockTargetOfferingResult = EligibilityContentOfferingResultFactory({
        stripeProductId: 'prod_test2',
        linkedFrom: {
          subGroupCollection: {
            items: [
              EligibilityContentSubgroupResultFactory({
                offeringCollection: {
                  items: [
                    EligibilityContentSubgroupOfferingResultFactory({
                      stripeProductId: 'prod_test',
                    }),
                    EligibilityContentSubgroupOfferingResultFactory({
                      stripeProductId: 'prod_test2',
                    }),
                    EligibilityContentSubgroupOfferingResultFactory({
                      stripeProductId: 'prod_test3',
                    }),
                  ],
                },
              }),
              EligibilityContentSubgroupResultFactory({
                offeringCollection: {
                  items: [
                    EligibilityContentSubgroupOfferingResultFactory({
                      stripeProductId: 'prod_test',
                    }),
                    EligibilityContentSubgroupOfferingResultFactory({
                      stripeProductId: 'prod_test2',
                    }),
                  ],
                },
              }),
            ],
          },
        },
      });
      const existingResult = EligibilityContentOfferingResultFactory({
        stripeProductId: 'prod_test',
      });
      mockOfferingResult.getOffering = jest
        .fn()
        .mockReturnValueOnce(mockTargetOfferingResult)
        .mockReturnValueOnce(existingResult);
      const result = await manager.getProductIdOverlap(
        ['prod_test2', 'prod_test3'],
        mockTargetOfferingResult
      );
      expect(result.length).toBe(2);
      expect(result[0]).toEqual({
        comparison: OfferingComparison.SAME,
        offeringProductId: 'prod_test2',
        type: 'offering',
      });
      expect(result[1]).toEqual({
        comparison: OfferingComparison.DOWNGRADE,
        offeringProductId: 'prod_test3',
        type: 'offering',
      });
    });
  });

  describe('compareOverlap', () => {
    it('returns create status when there are no overlaps', async () => {
      const mockOverlapResult = [] as OfferingOverlapResult[];
      const mockTargetOffering = EligibilityContentOfferingResultFactory();
      const mockInterval = 'month';
      const mockSubscribedPlans = [] as StripePlan[];

      const result = await manager.compareOverlap(
        mockOverlapResult,
        mockTargetOffering.defaultPurchase.stripePlanChoices,
        mockInterval,
        mockSubscribedPlans
      );
      expect(result).toEqual({
        eligibilityStatus: CartEligibilityStatus.CREATE,
        state: CartState.START,
      });
    });

    it('returns invalid when there are multiple existing overlap plans', async () => {
      const mockOverlapResult = [
        {
          comparison: OfferingComparison.SAME,
          offeringProductId: 'prod_test1',
          type: 'offering',
        },
        {
          comparison: OfferingComparison.SAME,
          offeringProductId: 'prod_test2',
          type: 'offering',
        },
      ] as OfferingOverlapResult[];
      const mockTargetOffering = EligibilityContentOfferingResultFactory();
      const mockInterval = 'month';
      const mockPlan = StripePlanFactory();
      const mockSubscribedPlans = [mockPlan, mockPlan];

      const result = await manager.compareOverlap(
        mockOverlapResult,
        mockTargetOffering.defaultPurchase.stripePlanChoices,
        mockInterval,
        mockSubscribedPlans
      );
      expect(result).toEqual({
        eligibilityStatus: CartEligibilityStatus.INVALID,
        state: CartState.FAIL,
      });
    });

    it('returns downgrade when comparison is downgrade', async () => {
      const mockOverlapResult = [
        {
          comparison: OfferingComparison.DOWNGRADE,
          offeringProductId: 'prod_test1',
          type: 'offering',
        },
      ] as OfferingOverlapResult[];
      const mockTargetOffering = EligibilityContentOfferingResultFactory();
      const mockInterval = 'month';
      const mockPlan = StripePlanFactory();
      const mockSubscribedPlans = [mockPlan];

      const result = await manager.compareOverlap(
        mockOverlapResult,
        mockTargetOffering.defaultPurchase.stripePlanChoices,
        mockInterval,
        mockSubscribedPlans
      );
      expect(result).toEqual({
        eligibilityStatus: CartEligibilityStatus.DOWNGRADE,
        state: CartState.FAIL,
      });
    });

    it('returns invalid if there is no subscribed plan with same productId as target plan', async () => {
      const mockOverlapResult = [
        {
          comparison: OfferingComparison.SAME,
          offeringProductId: 'prod_test1',
          type: 'offering',
        },
      ] as OfferingOverlapResult[];
      const mockTargetOffering = EligibilityContentOfferingResultFactory();
      const mockInterval = 'month';

      const result = await manager.compareOverlap(
        mockOverlapResult,
        mockTargetOffering.defaultPurchase.stripePlanChoices,
        mockInterval,
        []
      );
      expect(result).toEqual({
        eligibilityStatus: CartEligibilityStatus.INVALID,
        state: CartState.FAIL,
      });
    });

    it('returns invalid if subscribed plan with same product id as target plan', async () => {
      const mockOverlapResult = [
        {
          comparison: OfferingComparison.SAME,
          offeringProductId: 'prod_test1',
          type: 'offering',
        },
      ] as OfferingOverlapResult[];
      const mockTargetOffering = EligibilityContentOfferingResultFactory();
      const mockInterval = 'month';
      const mockPlan = StripePlanFactory();

      const result = await manager.compareOverlap(
        mockOverlapResult,
        mockTargetOffering.defaultPurchase.stripePlanChoices,
        mockInterval,
        [mockPlan]
      );
      expect(result).toEqual({
        eligibilityStatus: CartEligibilityStatus.INVALID,
        state: CartState.FAIL,
      });
    });

    it('returns downgrade when target plan interval is shorter than the subscribed plan', async () => {
      const mockTargetOffering = EligibilityContentOfferingResultFactory({
        stripeProductId: 'prod_test1',
      });
      const mockOverlapResult = [
        {
          comparison: OfferingComparison.SAME,
          offeringProductId: mockTargetOffering.stripeProductId,
          type: 'offering',
        },
      ] as OfferingOverlapResult[];
      const mockPlan1 = StripePlanFactory({
        interval: 'year',
        product: mockTargetOffering.stripeProductId,
      });
      const mockPlan2 = StripePlanFactory({
        interval: 'month',
        product: mockTargetOffering.stripeProductId,
      });
      const mockInterval = 'month';

      mockStripeManager.getPlanByInterval = jest
        .fn()
        .mockResolvedValueOnce(mockPlan2);

      const result = await manager.compareOverlap(
        mockOverlapResult,
        mockTargetOffering.defaultPurchase.stripePlanChoices,
        mockInterval,
        [mockPlan1]
      );
      expect(result).toEqual({
        eligibilityStatus: CartEligibilityStatus.DOWNGRADE,
        state: CartState.FAIL,
      });
    });

    it('returns upgrade when comparison is upgrade', async () => {
      const mockTargetOffering = EligibilityContentOfferingResultFactory({
        stripeProductId: 'prod_test1',
      });
      const mockPlan1 = StripePlanFactory({
        interval: 'month',
        product: mockTargetOffering.stripeProductId,
      });
      const mockPlan2 = StripePlanFactory({
        interval: 'year',
        product: mockTargetOffering.stripeProductId,
      });
      const mockInterval = 'year';
      const mockOverlapResult = [
        {
          comparison: OfferingComparison.UPGRADE,
          offeringProductId: mockTargetOffering.stripeProductId,
          type: 'offering',
        },
      ] as OfferingOverlapResult[];

      mockStripeManager.getPlanByInterval = jest
        .fn()
        .mockResolvedValueOnce(mockPlan2);

      const result = await manager.compareOverlap(
        mockOverlapResult,
        mockTargetOffering.defaultPurchase.stripePlanChoices,
        mockInterval,
        [mockPlan1]
      );
      expect(result).toEqual({
        eligibilityStatus: CartEligibilityStatus.UPGRADE,
        state: CartState.START,
      });
    });

    it('returns upgrade when target plan interval is longer than the subscribed plan', async () => {
      const mockTargetOffering = EligibilityContentOfferingResultFactory({
        stripeProductId: 'prod_test1',
      });
      const mockInterval = 'month';
      const mockPlan1 = StripePlanFactory({
        interval: 'month',
        product: mockTargetOffering.stripeProductId,
      });
      const mockPlan2 = StripePlanFactory({
        interval: 'year',
        product: mockTargetOffering.stripeProductId,
      });
      const mockOverlapResult = [
        {
          comparison: OfferingComparison.SAME,
          offeringProductId: mockTargetOffering.stripeProductId,
          type: 'offering',
        },
      ] as OfferingOverlapResult[];

      mockStripeManager.getPlanByInterval = jest
        .fn()
        .mockResolvedValueOnce(mockPlan2);

      const result = await manager.compareOverlap(
        mockOverlapResult,
        mockTargetOffering.defaultPurchase.stripePlanChoices,
        mockInterval,
        [mockPlan1]
      );
      expect(result).toEqual({
        eligibilityStatus: CartEligibilityStatus.UPGRADE,
        state: CartState.START,
      });
    });
  });
});
