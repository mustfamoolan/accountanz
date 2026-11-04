<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);

        // Ensure users exist for all roles in testing
        User::firstOrCreate(
            ['username' => 'accountant'],
            [
                'name' => 'علي المحاسب',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
                'role' => 'accountant',
            ]
        );

        User::firstOrCreate(
            ['username' => 'investor'],
            [
                'name' => 'أحمد المستثمر',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
                'role' => 'investor',
            ]
        );
    }

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_users_can_authenticate_with_valid_credentials_and_identify_roles(): void
    {
        $roles = ['admin', 'accountant', 'investor'];

        foreach ($roles as $role) {
            $user = User::where('role', $role)->first();
            
            $this->assertNotNull($user, "User for role {$role} must exist.");

            $response = $this->post('/login', [
                'username' => $user->username,
                'password' => 'password',
            ]);

            $this->assertAuthenticatedAs($user);
            $response->assertRedirect('/dashboard');

            $this->assertEquals($role, auth()->user()->role);

            // Log out for next iteration
            $this->post('/logout');
            $this->assertGuest();
        }
    }

    public function test_users_cannot_authenticate_with_invalid_password(): void
    {
        $user = User::where('role', 'admin')->first();

        $response = $this->post('/login', [
            'username' => $user->username,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
        $response->assertSessionHasErrors('username');
    }
}
