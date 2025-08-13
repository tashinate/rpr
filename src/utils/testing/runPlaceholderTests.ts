/**
 * Test Runner for Placeholder Validation
 * Execute this to verify all placeholders work correctly
 */

import { placeholderValidator } from './placeholderValidator';

/**
 * Run comprehensive placeholder tests
 */
export async function runPlaceholderTests(): Promise<void> {
  console.log('🚀 Starting Comprehensive Placeholder Validation Tests...\n');
  
  try {
    // Run all tests
    const results = await placeholderValidator.validateAllPlaceholders();
    
    console.log('\n📋 DETAILED RESULTS:');
    console.log('='.repeat(80));
    
    // Group results by category
    const resultsByCategory = results.results.reduce((acc, result) => {
      // Extract category from template pattern
      let category = 'general';
      if (result.template.includes('/sharepoint/') || result.template.includes('/teams/') || result.template.includes('/onedrive/')) {
        category = 'microsoft';
      } else if (result.template.includes('/api/') || result.template.includes('/corporate/')) {
        category = 'business';
      } else if (result.template.includes('/orders/') || result.template.includes('/products/')) {
        category = 'ecommerce';
      } else if (result.template.includes('/gov/') || result.template.includes('/public/')) {
        category = 'government';
      } else if (result.template.includes('/patient/') || result.template.includes('/medical/')) {
        category = 'medical';
      } else if (result.template.includes('/student/') || result.template.includes('/academic/')) {
        category = 'education';
      } else if (result.template.includes('/downloads/') || result.template.includes('/api/v')) {
        category = 'technology';
      } else if (result.template.includes('/banking/') || result.template.includes('/investment/')) {
        category = 'finance';
      } else if (result.template.includes('/complex/')) {
        category = 'complex';
      }
      
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(result);
      return acc;
    }, {} as Record<string, typeof results.results>);
    
    // Display results by category
    Object.entries(resultsByCategory).forEach(([category, categoryResults]) => {
      const passed = categoryResults.filter(r => r.success).length;
      const total = categoryResults.length;
      const percentage = Math.round(passed / total * 100);
      
      console.log(`\n📂 ${category.toUpperCase()} PATTERNS (${passed}/${total} - ${percentage}%)`);
      console.log('-'.repeat(60));
      
      categoryResults.forEach(result => {
        const status = result.success ? '✅ PASS' : '❌ FAIL';
        console.log(`${status}: ${result.template}`);
        
        if (!result.success) {
          console.log(`   🔍 Generated: ${result.generatedUrl}`);
          console.log(`   ⚠️  Missing: ${result.unreplacedPlaceholders.join(', ')}`);
          if (result.errors.length > 0) {
            console.log(`   ❌ Errors: ${result.errors.join(', ')}`);
          }
        }
      });
    });
    
    console.log('\n' + results.summary);
    
    // Identify most common missing placeholders
    const allMissingPlaceholders = results.results
      .filter(r => !r.success)
      .flatMap(r => r.unreplacedPlaceholders);
    
    const placeholderCounts = allMissingPlaceholders.reduce((acc, placeholder) => {
      acc[placeholder] = (acc[placeholder] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    if (Object.keys(placeholderCounts).length > 0) {
      console.log('\n🔍 MOST COMMON MISSING PLACEHOLDERS:');
      console.log('-'.repeat(40));
      Object.entries(placeholderCounts)
        .sort(([,a], [,b]) => b - a)
        .forEach(([placeholder, count]) => {
          console.log(`${placeholder}: ${count} occurrences`);
        });
    }
    
    // Performance recommendations
    if (results.failedTests > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('-'.repeat(40));
      console.log('1. Add missing placeholder generators to hybridPatternManager.ts');
      console.log('2. Enhance fallback parameter generation');
      console.log('3. Improve placeholder detection and replacement logic');
      console.log('4. Add comprehensive parameter validation');
    } else {
      console.log('\n🎉 ALL TESTS PASSED! Placeholder system is working perfectly.');
    }
    
  } catch (error) {
    console.error('❌ Error running placeholder tests:', error);
  }
}

/**
 * Test specific categories
 */
export async function testSpecificCategory(category: 'microsoft' | 'business' | 'ecommerce' | 'government' | 'medical' | 'education' | 'technology' | 'finance' | 'complex'): Promise<void> {
  console.log(`🧪 Testing ${category.toUpperCase()} placeholders...`);
  
  try {
    const results = await placeholderValidator.testPlaceholderType(category);
    
    console.log(`\n📊 ${category.toUpperCase()} RESULTS:`);
    console.log('='.repeat(50));
    
    results.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`${status}: ${result.template}`);
      
      if (!result.success) {
        console.log(`   Generated: ${result.generatedUrl}`);
        console.log(`   Missing: ${result.unreplacedPlaceholders.join(', ')}`);
      }
    });
    
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    console.log(`\n📈 Success Rate: ${passed}/${total} (${Math.round(passed / total * 100)}%)`);
    
  } catch (error) {
    console.error(`❌ Error testing ${category} placeholders:`, error);
  }
}

// Export for use in other modules
export { placeholderValidator };

// If running directly, execute all tests
if (typeof window === 'undefined' && require.main === module) {
  runPlaceholderTests().catch(console.error);
}
