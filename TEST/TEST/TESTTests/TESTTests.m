//
//  TESTTests.m
//  TESTTests
//
//  Created by Christopher Stamper on 11/12/15.
//  Copyright © 2015 Christopher Stamper. All rights reserved.
//

#import <XCTest/XCTest.h>
#import <HealthKit/HealthKit.h>

#import "HealthKit.h"

@interface TESTTests : XCTestCase

@end

@implementation TESTTests

- (void)setUp {
    [super setUp];
    // Put setup code here. This method is called before the invocation of each test method in the class.
}

- (void)tearDown {
    // Put teardown code here. This method is called after the invocation of each test method in the class.
    [super tearDown];
}

- (void)testrequestauth {
    
    XCTestExpectation *expectation = [self expectationWithDescription:@"Authorization Succeed"];
    
    HealthKit *hk = [HealthKit new];
    [hk pluginInitialize];
    
    // Test for STEPS
    HKQuantityType *steps = [HKQuantityType quantityTypeForIdentifier:HKQuantityTypeIdentifierStepCount];
    NSSet *reqAuths = [[NSSet alloc]initWithArray:@[steps]];
    
    [hk requestAuthorizationUsingReadTypes:reqAuths withCallbackId:@"fake" andCompletion:^(CDVPluginResult *result, NSString *callbackId) {
        
        NSLog(@"%@", result.message);
        NSAssert(result.status.integerValue == CDVCommandStatus_OK, @"Request failed for: Authorization Request");
        [expectation fulfill];
    }];
    
    [self waitForExpectationsWithTimeout:10.0 handler:^(NSError *error) {
        if(error)
        {
            XCTFail(@"Expectation Failed with error: %@", error);
        }
    }];
}

- (void)testAuthStatus {
    
    // Should always fail, we're only allowed to see Write permissions which we don't request
    
    XCTestExpectation *expectation = [self expectationWithDescription:@"Status is Succeed"];
    
    HealthKit *hk = [HealthKit new];
    [hk pluginInitialize];
    
    HKQuantityType *steps = [HKQuantityType quantityTypeForIdentifier:HKQuantityTypeIdentifierStepCount];
    [hk checkAuthStatusWithCallbackId:@"fake" forType:steps
                        andCompletion:^(CDVPluginResult *result, NSString *callbackId) {
                            NSLog(@"%@", result.message);
                            NSAssert([result.message isEqualToString:@"authorized"], @"Authorization status is Fail");
                            [expectation fulfill];
                        }];
    
    
    [self waitForExpectationsWithTimeout:10.0 handler:^(NSError *error) {
        if(error)
        {
            XCTFail(@"Expectation Failed with error: %@", error);
        }
    }];
}

-(void)testFindWorkouts {
    XCTestExpectation *expectation = [self expectationWithDescription:@"Workouts is Succeed"];
    
    NSPredicate *workoutPredicate = [HKQuery predicateForWorkoutsWithWorkoutActivityType:HKWorkoutActivityTypeRunning];
    
    HealthKit *hk = [HealthKit new];
    [hk pluginInitialize];
    
    [hk findWorkoutsWithCallbackId:@"fake" forPredicate:workoutPredicate andCompletion:^(CDVPluginResult *result, NSString *callbackId) {
        NSLog(@"%@", result.message);
        NSAssert(result.status.integerValue == CDVCommandStatus_OK, @"Find workouts didn't work out!");
        [expectation fulfill];
    }];

     [self waitForExpectationsWithTimeout:10.0 handler:^(NSError *error) {
        if(error)
        {
            XCTFail(@"Expectation Failed with error: %@", error);
        }
    }];
}

-(void)testSumQTY {
    
    XCTestExpectation *expectation = [self expectationWithDescription:@"Sum is Succeed"];
    
    HealthKit *hk = [HealthKit new];
    [hk pluginInitialize];
    
    NSDictionary *params = @{@"startDate": @([NSDate new].timeIntervalSince1970-500), @"endDate": @([NSDate new].timeIntervalSince1970), @"sampleType": @"HKQuantityTypeIdentifierStepCount"};
    
    [hk sumQuantityTypeWithCallbackId:@"fake"
                             withArgs:params.mutableCopy
                        andCompletion:^(CDVPluginResult *result, NSString *callbackId) {
                            
                            NSLog(@"%@", result.message);
                            NSAssert(result.status.integerValue == CDVCommandStatus_OK, @"sumQTY failed");
                            [expectation fulfill];
                        }];

    [self waitForExpectationsWithTimeout:15.0 handler:^(NSError *error) {
        if(error)
        {
            XCTFail(@"Expectation Failed with error: %@", error);
        }
    }];
}

- (void)testPerformanceExample {
    // This is an example of a performance test case.
    [self measureBlock:^{
        // Put the code you want to measure the time of here.
    }];
}

@end
