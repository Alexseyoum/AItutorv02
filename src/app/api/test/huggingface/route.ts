// src/app/api/test/huggingface/route.ts
import { NextResponse } from "next/server";
import { HfInference } from '@huggingface/inference';

export async function GET() {
  try {
    // Check if environment variables are loaded
    const token = process.env.HUGGINGFACE_TOKEN;
    
    console.log('HuggingFace token status:', {
      exists: !!token,
      length: token?.length || 0,
      prefix: token ? token.substring(0, 10) + '...' : 'none'
    });
    
    if (!token) {
      return NextResponse.json({ error: 'HuggingFace token not set' }, { status: 500 });
    }
    
    // Test basic connectivity first
    try {
      console.log('Testing basic connectivity to HuggingFace endpoint...');
      const testResponse = await fetch('https://router.huggingface.co/hf-inference', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      console.log('Connectivity test result:', {
        status: testResponse.status,
        statusText: testResponse.statusText
      });
    } catch (connectivityError) {
      console.error('Connectivity test failed:', connectivityError);
    }
    
    // Test with endpoint client
    try {
      console.log('Testing with endpoint client...');
      const endpointClient = new HfInference(token).endpoint('https://router.huggingface.co/hf-inference');
      
      const endpointResult = await endpointClient.textGeneration({
        inputs: "The future of AI is",
        parameters: {
          max_new_tokens: 20,
          temperature: 0.7,
          return_full_text: false
        }
      });
      
      console.log('Endpoint client test result:', endpointResult);
      return NextResponse.json({
        success: true,
        result: endpointResult.generated_text,
        tokenExists: !!token,
        tokenLength: token?.length || 0,
        tokenPrefix: token ? token.substring(0, Math.min(10, token.length)) : null
      });
    } catch (endpointError) {
      console.error('Endpoint client test failed:', endpointError);
      return NextResponse.json({
        success: false,
        error: endpointError instanceof Error ? endpointError.message : 'Unknown error',
        tokenExists: !!token,
        tokenLength: token?.length || 0,
        tokenPrefix: token ? token.substring(0, Math.min(10, token.length)) : null
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
}